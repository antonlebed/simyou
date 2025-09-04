import { onRequestOptions as __api_battle_ts_onRequestOptions } from "C:\\Dev\\simyou\\functions\\api\\battle.ts"
import { onRequestPost as __api_battle_ts_onRequestPost } from "C:\\Dev\\simyou\\functions\\api\\battle.ts"
import { onRequestGet as __api_session_ts_onRequestGet } from "C:\\Dev\\simyou\\functions\\api\\session.ts"
import { onRequestOptions as __api_session_ts_onRequestOptions } from "C:\\Dev\\simyou\\functions\\api\\session.ts"

export const routes = [
    {
      routePath: "/api/battle",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_battle_ts_onRequestOptions],
    },
  {
      routePath: "/api/battle",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_battle_ts_onRequestPost],
    },
  {
      routePath: "/api/session",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_session_ts_onRequestGet],
    },
  {
      routePath: "/api/session",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_session_ts_onRequestOptions],
    },
  ]