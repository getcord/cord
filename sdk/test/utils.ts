import { isLocation, isValidMetadata } from 'common/types/index.ts';
import type { JsonObject } from 'common/types/index.ts';

export function unescapeXMLQuotes(input: string) {
  return input.replaceAll('&quot;', '"');
}

export function isValidLocation(location: string) {
  try {
    const parsed = JSON.parse(location);
    return typeof parsed === 'object' && isLocation(parsed);
  } catch {
    return false;
  }
}

export function isValidFilter(filter: string) {
  try {
    const parsed = JSON.parse(filter);
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false;
    }

    // Currently we only support filtering by metadata
    if (
      Object.keys(parsed).length !== 1 ||
      Object.keys(parsed)[0] !== 'metadata'
    ) {
      return false;
    }

    // Currently, metadata keys and values must both be of type string
    const metadata = parsed['metadata'] as JsonObject;
    return isValidMetadata(metadata);
  } catch {
    return false;
  }
}

export function outerHTMLOnly(node: HTMLElement | null) {
  if (!node) {
    return '';
  }

  return node.outerHTML.replace(node.innerHTML, '');
}
