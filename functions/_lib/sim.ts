import type { BattleRequest, ReplayV1 } from '../types';
import type { SnapshotV1 } from '../types';
export async function runServerSim(req: BattleRequest, ghost:{hash:string; snapshot: SnapshotV1}) {
const replay: ReplayV1 = { v:1, game_v:req.client_build, initial:{ player:req.player_setup.board, ghost:[0,0,0] }, events:[ {t:0,e:'spawn',side:'P',slot:0,unit:req.player_setup.board[0]??0}, {t:2,e:'win',side:'P'} ] } as any;
const result = { win:true, score:5, turns:req.run_step ?? 0 };
const playerSnapshot: SnapshotV1 = { v:1, game_v:req.client_build, seed:req.player_setup.seed, actions:[], result };
return { replay, result, playerSnapshot, ghostHash: ghost.hash };
}