import { redis } from '../db/redis';
import { Session, ConversationState, ConversationContext } from '../types';
import { BotReply } from '../types';

/**
 * Session state lives in Redis, keyed by phone number, with a TTL so stale
 * conversations don't linger forever. This is why there's no
 * `whatsapp_sessions` table in Postgres — it would just be a slower,
 * harder-to-expire copy of the same ephemeral data.
 */

const TTL_SECONDS = 60 * 60 * 24; // 24h of inactivity before a session resets
const key = (phone: string) => `oxbot:session:${phone}`;

async function readRaw(phone: string): Promise<Session | null> {
  const raw = await redis.get(key(phone));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

async function writeRaw(phone: string, session: Session): Promise<void> {
  await redis.set(key(phone), JSON.stringify(session), 'EX', TTL_SECONDS);
}

export async function getSession(phone: string): Promise<Session> {
  const existing = await readRaw(phone);
  if (existing) return existing;

  const fresh: Session = { phone, state: 'FRESH', context: {}, updatedAt: Date.now() };
  await writeRaw(phone, fresh);
  return fresh;
}

export async function setState(
  phone: string,
  state: ConversationState,
  contextPatch: Partial<ConversationContext> = {},
  lastPrompt?: string,
  lastCta?: BotReply["cta"]
): Promise<Session> {
  const session = await getSession(phone);

  session.state = state;
  session.context = { ...session.context, ...contextPatch };
  session.updatedAt = Date.now();

  session.lastPrompt = lastPrompt;
  session.lastCta = lastCta;

  await writeRaw(phone, session);
  return session;
}

export async function resetSession(phone: string): Promise<Session> {
  const fresh: Session = { phone, state: 'MAIN_MENU', context: {}, updatedAt: Date.now() };
  await writeRaw(phone, fresh);
  return fresh;
}

/**
 * PAUSE mid-flow: stash where they were so RESUME can bring it back.
 * Only one paused flow is kept at a time — pausing again simply overwrites
 * whatever was previously paused.
 */
export async function pauseSession(phone: string): Promise<Session> {
  const session = await getSession(phone);
  session.paused = {
  state: session.state,
  context: session.context,
  lastPrompt: session.lastPrompt,
  lastCta: session.lastCta,
};
  console.log(session)
  session.state = 'MAIN_MENU';
  session.context = {};
  session.updatedAt = Date.now();
  await writeRaw(phone, session);
  return session;
}

/** RESUME: restore a paused flow, if any. Returns null if nothing to resume. */
export async function resumeSession(phone: string): Promise<Session | null> {
  const session = await getSession(phone);
  if (!session.paused) return null;

  session.state = session.paused.state;
session.context = session.paused.context;
session.lastPrompt = session.paused.lastPrompt;
session.lastCta = session.paused.lastCta;
  session.paused = undefined;
  session.updatedAt = Date.now();
  await writeRaw(phone, session);
  return session;
}

export async function hasPausedSession(phone: string): Promise<boolean> {
  const session = await readRaw(phone);
  return !!session?.paused;
}

/** Discard a paused flow without restoring it (buyer chose to start something new instead). */
export async function clearPaused(phone: string): Promise<Session> {
  const session = await getSession(phone);
  session.paused = undefined;
  session.updatedAt = Date.now();
  await writeRaw(phone, session);
  return session;
}
