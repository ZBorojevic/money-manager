// lib/bootstrap.ts
import { ensureUserDefaults } from "./defaults";

/**
 * Privremeni alias da ne rušimo postojeće stranice
 * koje još uvoze ensureUserBootstrap.
 */
export async function ensureUserBootstrap(userId: string) {
  return ensureUserDefaults(userId);
}

// (opcionalno) zadrži i direktan export za nove uvoze
export { ensureUserDefaults };
