export const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    export function withCORS(origin?:string) {
    return { 'Access-Control-Allow-Origin': origin || '*', Vary: 'Origin' } as Record<string,string>;
    }
    export async function hmacSession(sessionId:string, secret:string) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sessionId + '|v1'));
    return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }