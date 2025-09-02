/// <reference types="@cloudflare/workers-types" />
import type { BattleRequest, BattleResponse } from '../types';
import { securityHeaders, corsFor, hmacSession } from '../_lib/security';
import { sampleGhost, saveSnapshotAndMeta, saveReplay } from '../_lib/store';
import { runServerSim } from '../_lib/sim';
export const onRequestOptions: PagesFunction = async ({ request, env }) => {
const headers = { ...securityHeaders, ...corsFor(env as { ALLOWED_ORIGIN?: string }, request) };
return new Response(null, { status: 204, headers });
};
export const onRequestPost: PagesFunction = async ({ request, env }) => {
const headers = { 'Content-Type':'application/json', ...securityHeaders, ...corsFor(env as { ALLOWED_ORIGIN?: string }, request) };
try {
const body = await request.json() as BattleRequest;
if (!body?.game_slug || !body?.player_setup) return new Response(JSON.stringify({ ok:false, error:'bad payload' }), { status:400, headers });
if (JSON.stringify(body).length > 64 * 1024) return new Response(JSON.stringify({ ok:false, error:'payload too large' }), { status:413, headers });
const session = (request.headers.get('x-simyou-session') ?? '').trim();
const token = (request.headers.get('x-simyou-session-token') ?? '').trim();
if (!session || !token) return new Response(JSON.stringify({ ok:false, error:'missing session' }), { status:401, headers });
const { SESSION_SECRET } = (env as unknown as { SESSION_SECRET: string });
const expected = await hmacSession(session, SESSION_SECRET);
if (expected !== token) return new Response(JSON.stringify({ ok:false, error:'invalid session' }), { status:401, headers });
const ghost = await sampleGhost(env, body.game_slug, body.stage_band, body.last_outcome);
const simOut = await runServerSim(body, ghost);
const { playerHash } = await saveSnapshotAndMeta(env, body, simOut.playerSnapshot, session);
const replayId = await saveReplay(env, body.game_slug, playerHash, simOut.ghostHash, simOut.replay, simOut.result);
const resp: BattleResponse = { ok:true, result: simOut.result, ghost_hash: simOut.ghostHash, replay_id: replayId, replay: simOut.replay };
return new Response(JSON.stringify(resp), { headers });
} catch (e:any) {
return new Response(JSON.stringify({ ok:false, error: e?.message || 'error' }), { status:500, headers });
}
};