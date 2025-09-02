export const securityHeaders = {
    'Content-Security-Policy': "default-src 'self'",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    /** Allow multiple origins via comma-separated ALLOWED_ORIGIN env var */
    export function corsFor(env: { ALLOWED_ORIGIN?: string }, req: Request) {
    const origin = req.headers.get('origin') ?? '';
    const allow = (env.ALLOWED_ORIGIN ?? '')
    .split(',').map(s => s.trim()).filter(Boolean);
    const allowed = allow.length ? (allow.includes(origin) ? origin : allow[0]) : '*';
    return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,x-simyou-session,x-simyou-session-token',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    } as Record<string, string>;
    }
    
    // keep your hmacSession as-is
    export async function hmacSession(sessionId:string, secret:string) {
    const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sessionId + '|v1'));
    return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }