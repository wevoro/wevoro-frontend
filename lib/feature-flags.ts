/**
 * Admin-facing switches for work that is built but not being shown yet.
 *
 * These hide UI only. Nothing here turns a feature off on the server: the
 * endpoints, the settings and the AI assist inside the Confirm and
 * "Not confirmed" windows all keep working exactly as before.
 */

/**
 * The "Run AI check" button on an application, which reads every credential the
 * caregiver has uploaded and confirms or marks each one not confirmed in one
 * press.
 */
export const SHOW_AI_RUN_CHECK = true;

/**
 * The "AI Automation" item in the admin sidebar and its settings page — the two
 * switches for AI assist and for letting the AI decide by itself.
 *
 * Hidden at Riad's request on 2026-09-23 while the reader is still being
 * tested. The page stays reachable at /admin/ai-automation for anyone who types
 * the address, and AI automation is stored as OFF, so hiding the switch cannot
 * leave credentials being decided by themselves.
 */
export const SHOW_AI_AUTOMATION_PAGE = false;
