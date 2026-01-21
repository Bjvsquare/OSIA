import fs from 'fs/promises';
import path from 'path';

export class JsonDb {
    private dataDir: string;
    private cache: Map<string, any> = new Map();

    constructor() {
        this.dataDir = path.join(__dirname, '..', '..', 'data');
        this.safeLog(`[JsonDb] Initialized with data directory: ${this.dataDir}`);
    }

    private safeLog(message: string, type: 'info' | 'warn' | 'error' = 'info') {
        try {
            if (type === 'error') console.error(message);
            else if (type === 'warn') console.warn(message);
            else console.log(message);
        } catch (e: any) {
            // Silence EPIPE or other terminal-related errors
        }
    }

    private async readJson<T>(filename: string): Promise<T> {
        // Check cache first (TTL-less for now, cleared on write)
        if (this.cache.has(filename)) {
            this.safeLog(`[JsonDb] Cache Hit: ${filename}`);
            return this.cache.get(filename) as T;
        }

        const filePath = path.join(this.dataDir, filename);
        this.safeLog(`[JsonDb] Reading: ${filePath} (Cache Miss)`);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            if (!data || data.trim() === '') {
                this.safeLog(`[JsonDb] File is empty: ${filename}`, 'warn');
                const emptyValue = (filename.endsWith('s.json') ? [] : {}) as unknown as T;
                this.cache.set(filename, emptyValue);
                return emptyValue;
            }
            try {
                const parsed = JSON.parse(data);
                this.safeLog(`[JsonDb] Successfully read ${filename} (${Array.isArray(parsed) ? parsed.length : 'Object'} items)`);
                this.cache.set(filename, parsed);
                return parsed as T;
            } catch (parseError: any) {
                this.safeLog(`[JsonDb] JSON Parse Error in ${filename}: ${parseError.message}`, 'error');
                const emptyValue = (filename.endsWith('s.json') ? [] : {}) as unknown as T;
                this.cache.set(filename, emptyValue);
                return emptyValue;
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                this.safeLog(`[JsonDb] Error reading ${filename}: ${error.message}`, 'warn');
            }
            // If file doesn't exist, return empty array/object assumed
            const emptyValue = (filename.endsWith('s.json') ? [] : {}) as unknown as T;
            this.cache.set(filename, emptyValue);
            return emptyValue;
        }
    }

    private async writeJson<T>(filename: string, data: T): Promise<void> {
        const filePath = path.join(this.dataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        // Clear cache for this file to ensure consistency
        this.cache.set(filename, data);
        this.safeLog(`[JsonDb] Cache Updated for ${filename}`);
    }

    // Generic collection methods
    async getCollection<T>(collectionName: string): Promise<T[]> {
        return this.readJson<T[]>(`${collectionName}.json`);
    }

    async saveCollection<T>(collectionName: string, data: T[]): Promise<void> {
        await this.writeJson(`${collectionName}.json`, data);
    }
}

export const db = new JsonDb();
