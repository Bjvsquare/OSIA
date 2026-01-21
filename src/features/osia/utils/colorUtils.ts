import { Color } from 'three';

export function hueToColor(hue: number, saturation = 0.8, lightness = 0.6): Color {
    return new Color().setHSL(hue / 360, saturation, lightness);
}

export function getOrbColor(type: string, hue: number): Color {
    switch (type) {
        case 'core':
            return new Color('#FFFFFF').lerp(new Color('#38bdf8'), 0.2); // Core is bright white-blue
        case 'cluster':
            return hueToColor(hue, 0.9, 0.65); // Clusters are vibrant
        case 'layer':
            return hueToColor(hue, 0.7, 0.45); // Layers are slightly darker/richer
        case 'synergy':
            return new Color('#FFB347').lerp(hueToColor(hue), 0.3);
        case 'trait':
            return hueToColor(hue, 0.7, 0.55);
        case 'subtrait':
            return hueToColor(hue, 0.5, 0.65);
        case 'expression':
            return hueToColor(hue, 1.0, 0.8);
        default:
            return hueToColor(hue);
    }
}

export function getConnectionColor(type: string): Color {
    switch (type) {
        case 'synergy':
            return new Color('#818cf8');
        case 'complement':
            return new Color('#c084fc');
        case 'parent-child':
            return new Color('#38bdf8').multiplyScalar(0.5); // Subdued cyan
        default:
            return new Color('#38bdf8').multiplyScalar(0.3);
    }
}
