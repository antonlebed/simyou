/// <reference types="@cloudflare/workers-types" />

declare global {
    interface Env {
      DB: D1Database;
      SNAPSHOTS: R2Bucket;
      SIMYOU_CACHE: KVNamespace;
      SESSION_SECRET: string;
      ALLOWED_ORIGIN?: string;
    }
  }
  export {};
  