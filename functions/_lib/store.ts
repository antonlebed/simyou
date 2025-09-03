import type { BattleRequest, SnapshotV1 } from '../types';
export async function sampleGhost(env:any, game:string, band:number, outcome:'W'|'L'|'N') {
return { hash: 'gh_' + band + outcome, snapshot: { v:1, game_v:'dev', seed:0, actions:[] } } as any;
}
export async function saveSnapshotAndMeta(env:any, req:BattleRequest, snapshot:SnapshotV1, sessionId:string) {
return { playerHash: 'phash_dev' };
}
export async function saveReplay(env:any, game:string, playerHash:string, ghostHash:string, replay:any, result:any) {
return 'rpl_dev';
}