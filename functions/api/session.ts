/// <reference types="@cloudflare/workers-types" />
import { hmacSession, securityHeaders, corsFor } from '../_lib/security';
export const onRequestOptions: PagesFunction = async ({ request, env }) => {
const headers = { 'Cache-Control': 'no-store', ...securityHeaders, ...corsFor(env as { ALLOWED_ORIGIN?: string }, request) };
return new Response(null, { status: 204, headers });
};
export const onRequestGet: PagesFunction =
async ({ request, env }) => {
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...securityHeaders, ...corsFor(env as { ALLOWED_ORIGIN?: string }, request) };
const session = (request.headers.get('x-simyou-session') ?? '').trim();
if (!session) return new Response(JSON.stringify({ ok: false, error: 'missing session' }), { status: 400, headers });
const { SESSION_SECRET } = (env as unknown as { SESSION_SECRET: string });
const token = await hmacSession(session, SESSION_SECRET);
return new Response(JSON.stringify({ ok: true, token, exp_s: 900 }), { headers });
};