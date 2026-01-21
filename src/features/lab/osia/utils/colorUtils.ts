import { Color } from 'three';

// Three.js setHSL expects hue in 0-1 range. Our data stores it in degrees (0-360).
export function hueToColor(hueDegrees: number, saturation = 0.8, lightness = 0.6): Color {
    return new Color().setHSL(hueDegrees / 360, saturation, lightness);
}

export function getOrbColor(type: string, hue: number): Color {
    switch (type) {
        case 'core':
            return new Color('#FF8C00').lerp(new Color('#FFD700'), 0.5);
        case 'synergy':
            return new Color('#FFB347').lerp(hueToColor(hue), 0.3);
        case 'sharedVision':
            return new Color('#FFA500').lerp(hueToColor(hue), 0.4);
        case 'complementary':
            return new Color('#FF6B35').lerp(hueToColor(hue), 0.3);
        case 'collectiveIntelligence':
            return new Color('#FFD700').lerp(new Color('#FF8C00'), 0.5);
        case 'trait':
            return hueToColor(hue, 0.7, 0.55);
        case 'sub-trait':
            return hueToColor(hue, 0.5, 0.65);
        case 'expression':
            return hueToColor(hue, 0.75, 0.6);
        default:
            return hueToColor(hue);
    }
}

export function getConnectionColor(type: string): Color {
    switch (type) {
        case 'synergy':
            return new Color('#FFD700');
        case 'complement':
            return new Color('#FF8C42');
        case 'shared-vision':
            return new Color('#FFA07A');
        case 'parent-child':
            return new Color('#87CEEB');
        default:
            return new Color('#FFFFFF');
    }
}
