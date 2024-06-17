import type { JsonObject } from 'common/types/index.ts';
import type { JsonObjectReducerData } from 'common/util/jsonObjectReducer.ts';
import {
  jsonObjectReduce,
  mergeJsonObjectReducerData,
} from 'common/util/jsonObjectReducer.ts';

describe('mergeJsonObjectReducerData', () => {
  test('full data update', () => {
    const state: JsonObjectReducerData = { data: { foo: 'bar', baz: 'bazz' } };
    const update: JsonObjectReducerData = { data: { foo: 'baz', x: 'y' } };

    expect(mergeJsonObjectReducerData(state, update)).toEqual(update);

    const emptyState: JsonObjectReducerData = {};
    expect(mergeJsonObjectReducerData(emptyState, update)).toEqual(update);

    const incompleteState: JsonObjectReducerData = { update: { foo: 'bar' } };
    expect(mergeJsonObjectReducerData(incompleteState, update)).toEqual(update);
  });

  test('apply update', () => {
    const originalState: JsonObjectReducerData = {
      data: { foo: 'bar', baz: 'bazz' },
    };
    const update: JsonObjectReducerData = { update: { foo: 'baz', x: 'y' } };

    expect(mergeJsonObjectReducerData(originalState, update)).toEqual({
      data: { foo: 'baz', baz: 'bazz', x: 'y' },
    });
  });

  test('delete fields', () => {
    const originalState: JsonObjectReducerData = {
      data: { foo: 'bar', baz: 'bazz' },
    };
    const update: JsonObjectReducerData = { delete: ['baz', 'x'] };

    expect(mergeJsonObjectReducerData(originalState, update)).toEqual({
      data: { foo: 'bar' },
    });
  });

  test('update and delete fields', () => {
    const originalState: JsonObjectReducerData = {
      data: { foo: 'bar', baz: 'bazz', x: 'y' },
    };
    const update: JsonObjectReducerData = {
      update: { foo: 'baz' },
      delete: ['x'],
    };

    expect(mergeJsonObjectReducerData(originalState, update)).toEqual({
      data: { foo: 'baz', baz: 'bazz' },
    });
  });

  test('combine updates', () => {
    const update1: JsonObjectReducerData = {
      update: { foo: 'bar', baz: 'bazz', x: 'y' },
    };
    const update2: JsonObjectReducerData = {
      update: { foo: 'baz' },
      delete: ['x'],
    };

    expect(mergeJsonObjectReducerData(update1, update2)).toEqual({
      update: { foo: 'baz', baz: 'bazz' },
      delete: ['x'],
    });
  });
});

describe('jsonObjectReduce', () => {
  test('full data update', () => {
    const state: JsonObject = { foo: 'bar', baz: 'bazz' };
    const newState: JsonObject = { foo: 'baz', x: 'y' };

    expect(jsonObjectReduce(state, { data: newState })).toEqual(newState);

    expect(jsonObjectReduce({}, { data: newState })).toEqual(newState);
  });

  test('apply update', () => {
    const originalState: JsonObject = { foo: 'bar', baz: 'bazz' };
    const update: JsonObjectReducerData = { update: { foo: 'baz', x: 'y' } };

    expect(jsonObjectReduce(originalState, update)).toEqual({
      foo: 'baz',
      baz: 'bazz',
      x: 'y',
    });
  });

  test('delete fields', () => {
    const originalState: JsonObject = {
      foo: 'bar',
      baz: 'bazz',
    };
    const update: JsonObjectReducerData = { delete: ['baz', 'x'] };

    expect(jsonObjectReduce(originalState, update)).toEqual({ foo: 'bar' });
  });

  test('update and delete fields', () => {
    const originalState: JsonObject = {
      foo: 'bar',
      baz: 'bazz',
      x: 'y',
    };
    const update: JsonObjectReducerData = {
      update: { foo: 'baz' },
      delete: ['x'],
    };

    expect(jsonObjectReduce(originalState, update)).toEqual({
      foo: 'baz',
      baz: 'bazz',
    });
  });
});
