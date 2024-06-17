import isUUID from 'validator/lib/isUUID.js';
import type { UUID } from 'common/types/index.ts';

// This file contains utilities for handling "external IDs", which are IDs that
// our partners supply us to identify objects that they created.  We allow them
// to use mostly arbitrary strings for this, since how they identify objects can
// vary in lots of ways.  Any time an ID appears in an API, it should be an
// external ID.
//
// There are some cases where a partner might get access to an object that they
// didn't create (eg, they have a thread list which contains both threads they
// created and threads created via a sidebar component), in which case we need
// to supply them with an ID.  We call these "externalized IDs", which are our
// internal IDs (generally our normal UUIDs) with a "cord:" prefix.  We disallow
// "cord:"-prefixed values as external IDs, so that it's unambiguous which kind
// of ID it is when we see one.
//
// When creating an object, just check isValidExternalID.
//
// When reading an object, the general pattern is:
//
// if (isExternalizedID(id)) {
//   readByID(extractInternalID(id));
// } else if (!isValidExternalID(id)) {
//   throw new Error("Invalid identifier");
// } else {
//   readByExternalID(id);
// }

// emails can be up to 320 chars long
const MAX_EXTERNAL_ID_LENGTH = 320;
const ID_TO_EXTERNAL_ID_PREFIX = 'cord:';

export function isValidExternalID(id: string | number): boolean {
  const stringifiedID = id.toString();

  // This counts the number of Unicode characters, whereas id.length reports the
  // number of UTF-16 code units; see
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length
  const charLength = [...stringifiedID].length;
  if (charLength <= 0 || MAX_EXTERNAL_ID_LENGTH < charLength) {
    return false;
  }
  // Don't allow external IDs that could be confused with our
  // internal-ID-as-external-ID strings
  if (stringifiedID.startsWith(ID_TO_EXTERNAL_ID_PREFIX)) {
    return false;
  }
  // Don't allow any values from the "Other" Unicode category (control
  // characters, private use characters, unassigned code points, etc)
  if (stringifiedID.match(/\p{C}/u)) {
    return false;
  }
  return true;
}

export function externalizeID(id: UUID): string {
  return `${ID_TO_EXTERNAL_ID_PREFIX}${id}`;
}

export function isExternalizedID(externalID: string): boolean {
  return (
    externalID.startsWith(ID_TO_EXTERNAL_ID_PREFIX) &&
    isUUID.default(externalID.substring(ID_TO_EXTERNAL_ID_PREFIX.length))
  );
}

export function extractInternalID(externalizedID: string): UUID | null {
  if (!isExternalizedID(externalizedID)) {
    return null;
  }
  return externalizedID.substring(ID_TO_EXTERNAL_ID_PREFIX.length);
}
