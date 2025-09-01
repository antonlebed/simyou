export const SESSION_KEY = 'simyou.session_id';
export function getSessionId(): string {
let id = localStorage.getItem(SESSION_KEY);
if (!id) { id = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, id); }
return id;
}
export function getOptOut(): boolean {
return localStorage.getItem('simyou.opt_out') === '1';
}