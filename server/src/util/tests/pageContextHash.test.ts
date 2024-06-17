import { getPageContextHash } from 'server/src/util/hash.ts';

test('location-only data should hash the same with or without provider', () => {
  const [hashNoProvider] = getPageContextHash({
    location: null,
    providerID: null,
    data: { location: 'https://news.ycombinator.com/item?id=27156859' },
  } as any);
  const [hashWithProvider] = getPageContextHash({
    location: null,
    providerID: 'ea1a8736-39ab-46ca-856f-40c6b4858ee8',
    data: { location: 'https://news.ycombinator.com/item?id=27156859' },
  } as any);
  expect(hashNoProvider).toBe(hashWithProvider);
});

// These regression tests match specific rows from the DB in Feb 2022.  We want
// to ensure they continue to produce the same hashes even as we change the
// implementation of the hash function.
test('regression: location-only hash', () => {
  const [hash, data] = getPageContextHash({
    location: 'https://news.ycombinator.com/item?id=27156859',
    providerID: null,
    data: { location: 'https://news.ycombinator.com/item?id=27156859' },
  } as any);
  expect(hash).toBe('fb5f1ca5-333c-5c2f-baf0-a144a77f4730');
  expect(data).toEqual({
    location: 'https://news.ycombinator.com/item?id=27156859',
  });
});

test('regression: provider deny rule', () => {
  const [hash, data] = getPageContextHash({
    location:
      'https://admin.cord.com/errors/1a5838a1-3b9a-4eb4-aa85-074cbebbc9f3',
    providerID: 'ea1a8736-39ab-46ca-856f-40c6b4858ee8',
    data: {
      location:
        'https://admin.cord.com/errors/1a5838a1-3b9a-4eb4-aa85-074cbebbc9f3',
    },
  } as any);
  expect(hash).toBe('6cc575c8-401c-51b9-87bb-38c44a502af3');
  expect(data).toEqual({
    location:
      'https://admin.cord.com/errors/1a5838a1-3b9a-4eb4-aa85-074cbebbc9f3',
  });
});
