export const resolveAvatarUrl = (url?: string) => {
    if (!url) return null;
    // If already a full URL (e.g. Google avatar), return as-is
    if (url.startsWith('http')) return url;

    // For relative paths like /uploads/avatar.png:
    // In production, the API serves from the same origin (no separate port)
    // In development, Vite proxies /api and /uploads to the backend
    // So we just need to return the relative path — no port needed
    return url.startsWith('/') ? url : `/${url}`;
};
