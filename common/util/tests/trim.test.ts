import { trim, trimEnd, trimStart } from '@cord-sdk/react/common/lib/trim.ts';

describe('trim', () => {
  test('trimStart', () => {
    expect(trimStart('hello', '#')).toBe('hello');
    expect(trimStart('hel#lo', '#')).toBe('hel#lo');
    expect(trimStart('###hello', '#')).toBe('hello');
    expect(trimStart('hello###', '#')).toBe('hello###');
    expect(trimStart('###hello###', '#')).toBe('hello###');
    expect(trimStart('#', '#')).toBe('');
    expect(trimStart('###', '#')).toBe('');
    expect(trimStart('', '#')).toBe('');
  });

  test('trimEnd', () => {
    expect(trimEnd('hello', '#')).toBe('hello');
    expect(trimEnd('hel#lo', '#')).toBe('hel#lo');
    expect(trimEnd('###hello', '#')).toBe('###hello');
    expect(trimEnd('hello###', '#')).toBe('hello');
    expect(trimEnd('###hello###', '#')).toBe('###hello');
    expect(trimEnd('#', '#')).toBe('');
    expect(trimEnd('###', '#')).toBe('');
    expect(trimEnd('', '#')).toBe('');
  });

  test('trim', () => {
    expect(trim('hello', '#')).toBe('hello');
    expect(trim('hel#lo', '#')).toBe('hel#lo');
    expect(trim('###hello', '#')).toBe('hello');
    expect(trim('hello###', '#')).toBe('hello');
    expect(trim('###hello###', '#')).toBe('hello');
    expect(trim('#', '#')).toBe('');
    expect(trim('###', '#')).toBe('');
    expect(trim('', '#')).toBe('');
  });
});
