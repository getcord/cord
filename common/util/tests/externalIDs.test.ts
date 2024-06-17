import { v4 as uuid } from 'uuid';
import { externalizeID, isValidExternalID } from 'common/util/externalIDs.ts';

describe('isValidExternalID', () => {
  test('invalid lengths are rejected', () => {
    expect(isValidExternalID('')).toBe(false);
    expect(isValidExternalID('abc')).toBe(true);
    expect(isValidExternalID('a'.repeat(400))).toBe(false);
  });

  test('invalid characters are rejected', () => {
    expect(isValidExternalID('abc\0')).toBe(false);
    expect(isValidExternalID('abc\ndef')).toBe(false);
    // The Apple icon is in a private use area
    expect(isValidExternalID('abc')).toBe(false);
  });

  test('cord-prefixed IDs are rejected', () => {
    expect(isValidExternalID('cord:foo')).toBe(false);
    expect(isValidExternalID(externalizeID(uuid()))).toBe(false);
  });
});
