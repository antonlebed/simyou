import { hmacSession, securityHeaders, withCORS } from '../_lib/security';
export const onRequestGet: PagesFunction<{ SESSION_SECRET:string; ALLOWED_ORIGIN?:string }> = async ({ request, env }) => {
const origin = request.headers.get('origin') ?? env.ALLOWED_ORIGIN ?? '*';
const headers = { 'Content-Type':'application/json', ...securityHeaders, ...withCORS(origin) };
const session = (request.headers.get('x-simyou-session') ?? '').trim();
if (!session) return new Response(JSON.stringify({ ok:false, error:'missing session' }), { status:400, headers });
const token = await hmacSession(session, env.SESSION_SECRET);
return new Response(JSON.stringify({ ok:true, token, exp_s:900 }), { headers });
};