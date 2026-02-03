export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getApiUrl(path: string): string {
    // Remove trailing slash from base URL if it exists
    const base = API_BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const finalUrl = `${base}${cleanPath}`;

    if (typeof window !== 'undefined') {
        // console.log(`[API] Calling: ${finalUrl}`);
    }

    return finalUrl;
}

export function getWsUrl(path: string): string {
    const base = API_BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Ensure we use wss:// for https:// and ws:// for http://
    const protocol = base.startsWith('https') ? 'wss' : 'ws';
    const host = base.replace(/^https?:\/\//, '');

    return `${protocol}://${host}${cleanPath}`;
}
