/**
 * @jest-environment jsdom
 */

import {
  compile,
  templateToNameFunction,
} from 'common/page_context/templating/index.ts';
import { documentWithTitle } from 'common/util/tests.ts';

test('regexReplace', () => {
  expect(
    compile(
      'Hello {{#regexReplace "([olx])" "$1$1$1"}}{{what}}{{/regexReplace}}',
    )({
      what: 'world',
    }),
  ).toEqual('Hello wooorllld');

  const template = compile(
    `{{#if title~}}
     {{#regexReplace "^\\([0-9]+\\) (.*)$" "$1"}}{{title}}{{/regexReplace}}
     {{~else}}Default{{/if}}`,
  );
  expect(template({})).toEqual('Default');
  expect(template({ title: false })).toEqual('Default');
  expect(template({ title: 'hello' })).toEqual('hello');
  expect(template({ title: '(123) hello' })).toEqual('hello');
});

test('contextData', () => {
  expect(compile('{{contextData foo}}')({ foo: { bar: 'baz' } })).toEqual(
    'bar: baz',
  );

  const result = compile('{{contextData .}}')({ foo: 1, bar: 2 });
  expect(
    result === 'foo: 1, bar: 2' || result === 'bar: 2, foo: 1',
  ).toBeTruthy();
});

test('assign as a helper', () => {
  expect(compile('{{assign "foo" "bar"}}{{foo}}')({})).toEqual('bar');
  expect(
    compile(`
      {{~assign "foo" "bar"~}}
      {{~assign "baz" foo~}}
      bar is {{baz~}}
    `)({}),
  ).toEqual('bar is bar');
});

test('assign as a block helper', () => {
  expect(compile('{{#assign "foo"}}bar{{/assign}}{{foo}}')({})).toEqual('bar');
  expect(
    compile(
      '{{#assign "foo"}}bar{{/assign}}{{#assign foo}}baz{{/assign}}{{bar}}',
    )({}),
  ).toEqual('baz');
});

test('templateToNameFunction', () => {
  const nameFunction = templateToNameFunction(`
        {{#if title}}
            {{title}}
        {{else}}
            {{context.foo}}
        {{/if}}
    `);

  const document = documentWithTitle('foobarbaz');

  expect(nameFunction({})).toEqual('');
  expect(nameFunction({ foo: 'yes' })).toEqual('yes');
  expect(nameFunction({}, document)).toEqual('foobarbaz');
  expect(nameFunction({ foo: 'yes' }, document)).toEqual('foobarbaz');
});
