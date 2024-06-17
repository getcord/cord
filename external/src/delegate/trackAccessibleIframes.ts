import { accessibleIframes } from 'sdk/client/core/iframe/accessibleIframes.ts';

/**
 * Does this iframe have our embed script, i.e. can it respond to EmbedXFrame messages
 */
export function isIframeAccessible(iframe: HTMLIFrameElement) {
  if (accessibleIframes.has(iframe)) {
    return true;
  }
  return false;
}
