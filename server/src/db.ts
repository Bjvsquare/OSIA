import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Simple JSON file-based database for development
 * Uses Promise wrappers for compatibility with async/await patterns
 */
export const db = {
    async getCollection<T>(name: string): Promise<T[]> {
        const filePath = path.join(DATA_DIR, `${name}.json`);

        if (!fs.existsSync(filePath)) {
            // Initialize empty collection
            fs.writeFileSync(filePath, '[]', 'utf-8');
            return [];
        }

        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data) as T[];
        } catch (error) {
            console.error(`Error reading ${name}:`, error);
            return [];
        }
    },

    async saveCollection<T>(name: string, data: T[]): Promise<void> {
        const filePath = path.join(DATA_DIR, `${name}.json`);

        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error(`Error saving ${name}:`, error);
            throw error;
        }
    }
};

/**
 * Helper functions for item-level operations
 */
export async function getItem<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
    const items = await db.getCollection<T>(collection);
    return items.find((item: T) => item.id === id) || null;
}

export async function updateItem<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const items = await db.getCollection<T>(collection);
    const index = items.findIndex((item: T) => item.id === id);

    if (index === -1) return null;

    items[index] = { ...items[index], ...updates };
    await db.saveCollection(collection, items);

    return items[index];
}
