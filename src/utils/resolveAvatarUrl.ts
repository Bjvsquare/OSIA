export const resolveAvatarUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;

    // Handle relative path (should start with /uploads)
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    // Port 3001 is where our backend live
    return `${protocol}//${host}:3001${url.startsWith('/') ? '' : '/'}${url}`;
};
