import {
  magicEnv,
  required,
  optional,
  defaultValue,
} from 'server/src/config/MagicEnv.ts';

test('simple test', () => {
  const processEnv = {
    FOO: 'hello',
    BAR: 'world',
    BAZ: 'the quick brown fox',
    BAZZZ: 'jumps over the lazy dog',
  };

  const result = magicEnv(processEnv, {
    FOO: required,
    BAR: optional,
    BAZ: required,
    BAX: defaultValue('baxxx'),
  }) satisfies {
    FOO: string;
    BAR: string | undefined;
    BAZ: string;
    BAX: string;
  };

  expect(result.FOO).toEqual('hello');
  expect(result.BAR).toEqual('world');
  expect(result.BAZ).toEqual('the quick brown fox');
  expect(result.BAX).toEqual('baxxx');
});

test('missing required field', () => {
  const processEnv = { BAR: 'no FOO in here' };

  expect(() => magicEnv(processEnv, { FOO: required })).toThrow();
});
