import type OpenAI from 'openai';

import { hasOwnProperty } from 'docs/lib/hasOwnProperty.ts';

// Super dumbed down port of
//   https://github.com/openai/openai-python/blob/main/openai/embeddings_utils.py#L67
// Returns a number between 0 and 1, where 1 is a perfect match
//
// The fancy OpenAI stuff is mostly written in numpy and not yet ported to JavaScript.

// We want to be cool kids, too, though. So, I ported over their cosine similarity function.
function dot(a: number[], b: number[]) {
  return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
}

function norm(v: number[]) {
  return Math.sqrt(dot(v, v));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  return dot(a, b) / (norm(a) * norm(b));
}

// Strong-handing the types from the network to make sure we're not
// accepting garbage.
export function assertIsEmbedding(
  thing: unknown,
): OpenAI.CreateEmbeddingResponse {
  if (
    thing &&
    hasOwnProperty(thing, 'data') &&
    Array.isArray(thing.data) &&
    thing.data[0] &&
    hasOwnProperty(thing.data[0], 'embedding') &&
    Array.isArray(thing.data[0].embedding)
  ) {
    return thing as OpenAI.CreateEmbeddingResponse;
  }
  throw new Error('Invalid CreateEmbeddingResponse');
}
