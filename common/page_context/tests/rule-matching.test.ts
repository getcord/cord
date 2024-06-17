import { v4 as uuidv4 } from 'uuid';

import { matchURLAgainstRule } from 'common/page_context/index.ts';
import { cleanupURL } from 'common/page_context/util.ts';
import type { ProviderRule } from 'common/types/index.ts';

test('successful match with default context function', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: { domain: '*.cord.com', path: 'users/:user' },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/users/andrei'),
  );

  expect(context).toEqual({ user: 'andrei' });
});

test('successful match with leading slash in pattern', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: '/users/:user',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/users/andrei'),
  );

  expect(context).toEqual({ user: 'andrei' });
});

test('successful match with trailing slash in path', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: 'users/:user',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/users/andrei/'),
  );

  expect(context).toEqual({ user: 'andrei' });
});

test('successful match root path', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: '/',
    },
  };

  const context = matchURLAgainstRule(rule, cleanupURL('http://www.cord.com/'));

  expect(context).toBeDefined();
});

test('successful match with custom context function', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'replace', data: { foo: 'bar' } },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: 'users/:user',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/users/andrei'),
  );

  expect(context).toEqual({ foo: 'bar' });
});

test('successful match of hash URL', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: '*',
      hash: 'users/:user',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com#users/andrei'),
  );

  expect(context).toEqual({ user: 'andrei' });
});

test('successful match of different hash URL', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: '*',
      hash: 'user=:user&order=:order',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com#user=andrei&order=123'),
  );

  expect(context).toEqual({ user: 'andrei', order: '123' });
});

test('successful match of metabase transformation', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'metabase', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: 'bi.:env.netpurpose.com',
      path: '/question',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL(
      'https://bi.prod.netpurpose.com/question#eyJkYXRhc2V0X3F1ZXJ5Ijp7InF1ZXJ5Ijp7InNvdXJjZS10YWJsZSI6MywiZmlsdGVyIjpbImFuZCIsWyI9IixbImZpZWxkLWlkIiwzMF0sIjEiXV19LCJ0eXBlIjoicXVlcnkiLCJkYXRhYmFzZSI6MX0sImRpc3BsYXkiOiJ0YWJsZSIsInZpc3VhbGl6YXRpb25fc2V0dGluZ3MiOnt9fQ==',
    ),
  );

  // The above hash decodes to the following object:
  // {
  //   dataset_query: {
  //     query: {
  //       'source-table': 3,
  //       filter: ['and', ['=', ['field-id', 30], '1']],
  //     },
  //     type: 'query',
  //     database: 1,
  //   },
  //   display: 'table',
  //   visualization_settings: {},
  // }

  // We expect the values to all be turned into strings and then the keys to be
  // converted to dotted notation.

  expect(context).toEqual({
    'dataset_query.query.source-table': '3',
    'dataset_query.query.filter.0': 'and',
    'dataset_query.query.filter.1.0': '=',
    'dataset_query.query.filter.1.1.0': 'field-id',
    'dataset_query.query.filter.1.1.1': '30',
    'dataset_query.query.filter.1.2': '1',
    'dataset_query.type': 'query',
    'dataset_query.database': '1',
    display: 'table',
  });
});

test('context function receives matches and parsed URL', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: {
      type: 'replace',
      data: {
        user: `{{user}}`,
        hostname: `{{url.hostname}}`,
        pathname: `{{url.pathname}}`,
        query: `{{contextData url.query}}`,
      },
    },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: 'users/:user',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/users/andrei?foo=bar'),
  );

  expect(context).toEqual({
    user: 'andrei',
    hostname: 'www.cord.com',
    pathname: '/users/andrei',
    query: 'foo: bar',
  });
});

test('single context for entire website', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'replace', data: { foo: 'bar' } },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: '*',
    },
  };

  const context1 = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/foo'),
  );

  const context2 = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/foo/bar'),
  );

  expect(context1).toEqual(context2);

  expect(context1).toEqual({ foo: 'bar' });
});

test('different context for every path', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: {
      type: 'replace',
      data: {
        path: `{{#if url.pathname}}{{url.pathname}}{{else}}{{url.href}}{{/if}}`,
      },
    },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: '*',
    },
  };

  const context1 = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/foo'),
  );

  const context2 = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/foo/bar'),
  );

  expect(context1).toEqual({ path: '/foo' });
  expect(context2).toEqual({ path: '/foo/bar' });
});

test('query param matching with malformed params', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      queryParams: {
        section: 'users',
        'id[1 ]': ':user',
      },
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL(
      'http://www.cord.com/foo?section=users&id%5B1%20%5D=%7Bandrei%20%22%3A%5Bthebest%29',
    ),
  );

  const expectedData = { user: '{andrei ":[thebest)' };

  expect(context).toEqual(expectedData);
});

test('query param matching with URLEncoded params', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      queryParams: {
        section: 'users',
        id: ':user',
      },
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL(
      'http://www.cord.com/foo?section=users&id=%7B%22andrei%22%3A%22is%5Bthe%5D%28best%29%22%7D',
    ),
  );

  const expectedData = { user: '{"andrei":"is[the](best)"}' };

  expect(context).toEqual(expectedData);
});

test('query param matching', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      queryParams: {
        section: 'users',
        id: ':user',
      },
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/foo?section=users&id=andrei'),
  );

  const expectedData = { user: 'andrei' };

  expect(context).toEqual(expectedData);
});

test('query param match fail', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      queryParams: {
        user: ':user',
      },
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/foo?section=about'),
  );

  expect(context).toBeUndefined();
});

test('by default returns same context for http and https', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: 'users/:user',
    },
  };

  const context1 = matchURLAgainstRule(
    rule,
    cleanupURL('https://www.cord.com/users/andrei'),
  );

  const context2 = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.cord.com/users/andrei'),
  );

  expect(context1).toBeDefined();
  expect(context2).toBeDefined();
  expect(context1).toEqual(context2);
});

test("domain pattern default doesn't capture path", () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      path: '/users/:user',
    },
  };

  // this should match
  const context1 = matchURLAgainstRule(
    rule,
    cleanupURL('https://www.cord.com/users/andrei'),
  );

  // this should not match
  const context2 = matchURLAgainstRule(
    rule,
    cleanupURL('https://www.cord.com/something/users/andrei'),
  );

  expect(context1).toEqual({ user: 'andrei' });
  expect(context2).toBeUndefined();
});

test('failed match due to incorrect protocol', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      protocol: 'ftp',
      domain: '*.cord.com',
      path: '*',
    },
  };

  const context = matchURLAgainstRule(rule, cleanupURL('http://www.cord.com/'));

  expect(context).not.toBeDefined();
});

test('failed match due to incorrect domain', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: 'cord.com',
      path: '*',
    },
  };

  const context = matchURLAgainstRule(rule, cleanupURL('http://www.cord.com/'));

  expect(context).not.toBeDefined();
});

test('failed match due to incorrect path', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      path: 'something',
    },
  };

  const context = matchURLAgainstRule(rule, cleanupURL('http://www.cord.com/'));

  expect(context).not.toBeDefined();
});

test('failed match due to incorrect hash', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      domain: '*.cord.com',
      hash: 'andrei',
    },
  };

  const context = matchURLAgainstRule(rule, cleanupURL('http://www.cord.com/'));

  expect(context).not.toBeDefined();
});
