import DocsEmbeddings from 'docs/server/searchData/Embeddings.ts';
import CordDotComEmbeddings from 'docs/server/searchData/CordDotComEmbeddings.ts';
import { assertIsEmbedding, cosineSimilarity } from 'docs/lib/openai.ts';
import urlToNavLink from 'docs/lib/urlToNavLink.ts';
import { hasOwnProperty } from 'docs/lib/hasOwnProperty.ts';

export type EmbeddingScore = {
  url: string;
  name: string;
  parentName?: string;
  similarity: number;
  plainText: string;
};

export function computeEmbeddingScores(
  searchEmbedding: number[],
  includedSites: { docs: boolean; cordDotCom: boolean },
): EmbeddingScore[] {
  const scores: EmbeddingScore[] = [];

  if (includedSites.docs) {
    for (const data of DocsEmbeddings) {
      // Be defensive against changes to the nav structure that aren't (yet)
      // reflected in the search data.
      if (!hasOwnProperty(urlToNavLink, data.url)) {
        console.error(
          'Search results returned for page not in the navigation: ' +
            data.url +
            ' | ' +
            'Please re-run ./dist/scripts/docs-generate-search-data.js',
        );
        continue;
      }

      const embedding = assertIsEmbedding(data.embedding);
      const similarity = cosineSimilarity(
        searchEmbedding,
        embedding.data[0].embedding,
      );
      scores.push({
        url: data.url,
        similarity,
        name: urlToNavLink[data.url].item.name,
        parentName: urlToNavLink[data.url].parent?.name,
        plainText: data.plaintext, // arbitrary
      });
    }
  }

  if (includedSites.cordDotCom) {
    for (const data of CordDotComEmbeddings) {
      const embedding = assertIsEmbedding(data.embedding);
      const similarity = cosineSimilarity(
        searchEmbedding,
        embedding.data[0].embedding,
      );
      scores.push({
        url: data.url,
        similarity,
        name: data.title,
        plainText: data.plaintext, // arbitrary
      });
    }
  }

  scores.sort((a, b) => b.similarity - a.similarity);

  return scores;
}
