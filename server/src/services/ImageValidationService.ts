import path from 'path';
import fs from 'fs/promises';

/* ═══════════════════════════════════════════════════════════
   ImageValidationService — V1 Image Validation
   
   Validates uploaded images for KYC portrait requirements:
   - Format: JPG, PNG, WebP
   - Resolution: minimum 400x400
   - File size: max 5MB
   - Aspect ratio: between 1:2 and 2:1
   
   V1 uses basic file stats + image header parsing.
   V2 will add face detection via cloud API.
   ═══════════════════════════════════════════════════════════ */

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MIN_DIMENSION = 400;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_ASPECT = 0.5;  // 1:2
const MAX_ASPECT = 2.0;  // 2:1

export interface ImageValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    metadata: {
        width: number;
        height: number;
        format: string;
        fileSizeBytes: number;
        aspectRatio: number;
    } | null;
}

// Minimal image header parsers (no heavy deps needed)
function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
        let offset = 2; // Skip SOI marker
        while (offset < buffer.length) {
            if (buffer[offset] !== 0xFF) break;
            const marker = buffer[offset + 1];
            // SOF markers (Start of Frame)
            if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7) ||
                (marker >= 0xC9 && marker <= 0xCB) || (marker >= 0xCD && marker <= 0xCF)) {
                const height = buffer.readUInt16BE(offset + 5);
                const width = buffer.readUInt16BE(offset + 7);
                return { width, height };
            }
            const segmentLength = buffer.readUInt16BE(offset + 2);
            offset += 2 + segmentLength;
        }
    } catch { }
    return null;
}

function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
        // PNG IHDR chunk starts at offset 16
        if (buffer[0] === 0x89 && buffer[1] === 0x50) {
            const width = buffer.readUInt32BE(16);
            const height = buffer.readUInt32BE(20);
            return { width, height };
        }
    } catch { }
    return null;
}

function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
        // RIFF....WEBP
        if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
            const chunk = buffer.toString('ascii', 12, 16);
            if (chunk === 'VP8 ') {
                // Lossy WebP
                const width = buffer.readUInt16LE(26) & 0x3FFF;
                const height = buffer.readUInt16LE(28) & 0x3FFF;
                return { width, height };
            } else if (chunk === 'VP8L') {
                // Lossless WebP
                const bits = buffer.readUInt32LE(21);
                const width = (bits & 0x3FFF) + 1;
                const height = ((bits >> 14) & 0x3FFF) + 1;
                return { width, height };
            } else if (chunk === 'VP8X') {
                // Extended WebP
                const width = (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1;
                const height = (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1;
                return { width, height };
            }
        }
    } catch { }
    return null;
}

class ImageValidationService {
    /**
     * Validate an image file at the given path.
     */
    async validateImage(filePath: string): Promise<ImageValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Check file exists
        try {
            await fs.access(filePath);
        } catch {
            return { valid: false, errors: ['File not found'], warnings: [], metadata: null };
        }

        // 2. Check file extension
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        if (!ALLOWED_FORMATS.includes(ext)) {
            errors.push(`Invalid format: ${ext}. Allowed: ${ALLOWED_FORMATS.join(', ')}`);
        }

        // 3. Check file size
        const stat = await fs.stat(filePath);
        if (stat.size > MAX_FILE_SIZE) {
            errors.push(`File too large: ${(stat.size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB`);
        }
        if (stat.size < 1024) {
            errors.push('File too small: less than 1KB. Please upload a real photo.');
        }

        // 4. Read image header for dimensions
        const buffer = Buffer.alloc(Math.min(stat.size, 4096));
        const fileHandle = await fs.open(filePath, 'r');
        await fileHandle.read(buffer, 0, buffer.length, 0);
        await fileHandle.close();

        let dimensions: { width: number; height: number } | null = null;
        const format = ext === 'jpg' ? 'jpeg' : ext;

        if (ext === 'jpg' || ext === 'jpeg') {
            dimensions = parseJpegDimensions(buffer);
        } else if (ext === 'png') {
            dimensions = parsePngDimensions(buffer);
        } else if (ext === 'webp') {
            dimensions = parseWebpDimensions(buffer);
        }

        if (!dimensions) {
            // If we can't parse dimensions, still allow but warn
            warnings.push('Could not read image dimensions. Please ensure this is a valid image file.');
            return {
                valid: errors.length === 0,
                errors,
                warnings,
                metadata: {
                    width: 0,
                    height: 0,
                    format,
                    fileSizeBytes: stat.size,
                    aspectRatio: 1
                }
            };
        }

        // 5. Check minimum resolution
        if (dimensions.width < MIN_DIMENSION || dimensions.height < MIN_DIMENSION) {
            errors.push(`Resolution too low: ${dimensions.width}×${dimensions.height}. Minimum: ${MIN_DIMENSION}×${MIN_DIMENSION}`);
        }

        // 6. Check aspect ratio
        const aspectRatio = dimensions.width / dimensions.height;
        if (aspectRatio < MIN_ASPECT || aspectRatio > MAX_ASPECT) {
            warnings.push(`Unusual aspect ratio: ${aspectRatio.toFixed(2)}. Portrait or square images work best.`);
        }

        // 7. Quality warnings
        if (dimensions.width < 600 || dimensions.height < 600) {
            warnings.push('Image resolution is acceptable but low. For best results, use at least 600×600.');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            metadata: {
                width: dimensions.width,
                height: dimensions.height,
                format,
                fileSizeBytes: stat.size,
                aspectRatio
            }
        };
    }
}

export const imageValidationService = new ImageValidationService();
