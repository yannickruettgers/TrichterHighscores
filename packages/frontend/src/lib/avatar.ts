import { createAvatar } from "@dicebear/core";
import * as adventurerNeutral from "@dicebear/adventurer-neutral";
import { normalizeParticipant } from "./leaderboard";

const avatarCache = new Map<string, string>();

/**
 * Generates an Adventurer Neutral avatar locally without contacting DiceBear.
 */
export function avatarDataUri(pseudonym: string): string {
  const seed = normalizeParticipant(pseudonym);
  const cachedAvatar = avatarCache.get(seed);

  if (cachedAvatar) {
    return cachedAvatar;
  }

  const dataUri = createAvatar(adventurerNeutral, { seed }).toDataUri();
  avatarCache.set(seed, dataUri);

  return dataUri;
}
