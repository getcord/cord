/**
 * @jest-environment jsdom
 */

import { v4 as uuidv4 } from 'uuid';

import { matchURLAgainstRule } from 'common/page_context/index.ts';
import { documentFromHTML } from 'common/util/tests.ts';
import type { ProviderRule } from 'common/types/index.ts';
import { cleanupURL } from 'common/page_context/util.ts';

const document = documentFromHTML(`
  <html>
    <body>
      <h1>cord is great yo</h1>
      <p>this is a paragraph</p>
      <p class="class">and this is another paragraph</p>
    </body>
  </html>
`);

test('simple selector match on h1', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: {
      type: 'replace',
      data: { title: `{{textContent element}}` },
    },
    nameTemplate: null,
    matchPatterns: {
      selector: 'h1',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.getradical.co/users/andrei'),
    document,
  );

  expect(context).toEqual({ title: 'cord is great yo' });
});

test('selector that matches multiple elements returns only the first', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: {
      type: 'replace',
      data: { text: `{{textContent element}}` },
    },
    nameTemplate: null,
    matchPatterns: {
      selector: 'p',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.getradical.co/users/andrei'),
    document,
  );

  expect(context).toEqual({ text: 'this is a paragraph' });
});

test('selector that matches text content', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: {
      type: 'replace',
      data: { text: `{{textContent element}}` },
    },
    nameTemplate: null,
    matchPatterns: {
      selector: 'p',
      contains: 'another',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.getradical.co/users/andrei'),
    document,
  );

  expect(context).toEqual({ text: 'and this is another paragraph' });
});

test('selector that matches nothing', () => {
  const rule: ProviderRule = {
    type: 'allow',
    id: uuidv4(),
    observeDOMMutations: false,
    contextTransformation: { type: 'default', data: null },
    nameTemplate: null,
    matchPatterns: {
      selector: 'ul',
    },
  };

  const context = matchURLAgainstRule(
    rule,
    cleanupURL('http://www.getradical.co/users/andrei'),
    document,
  );

  expect(context).toBeUndefined();
});
