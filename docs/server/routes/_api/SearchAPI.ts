import type { RequestHandler } from 'express';
import OpenAI from 'openai';

import Env from 'server/src/config/Env.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
import { escapeForSlack } from 'server/src/slack/message.ts';
import { computeEmbeddingScores } from 'docs/lib/embeddings/embeddings.ts';
import type { EmbeddingScore } from 'docs/lib/embeddings/embeddings.ts';
import { ipToLocation } from 'docs/lib/geoip/geoip.ts';

const OPENAI_API_SECRET = Env.OPENAI_API_SECRET;

const openai = new OpenAI({
  apiKey: OPENAI_API_SECRET,
});

async function createEmbedding(
  input: string,
): Promise<OpenAI.CreateEmbeddingResponse | undefined> {
  try {
    return await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input,
    });
  } catch (e) {
    if (Env.CORD_DOCS_SEARCH_SLACK_CHANNEL_ID) {
      await sendMessageToCord(
        `Failed to create embedding for query: \`${escapeForSlack(
          input,
        )}\nError: \`${escapeForSlack((e as Error).message)}\``,
        Env.CORD_DOCS_SEARCH_SLACK_CHANNEL_ID,
      );
    }
    console.error('Failed to fetch OpenAI search embedding: ', e);
  }
  return undefined;
}

// The embeddings can have linebreaks and spaces in them for basic formatting.
// In the page preview text in the search results, we actually don't want that
// since we only have one line.
function despace(str: string): string {
  return str.replace(/^\s+$/g, ' ').trim();
}

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
const SearchAPI: RequestHandler = async (req, res) => {
  if (
    !req.query.s ||
    typeof req.query.s !== 'string' ||
    req.query.s.length > 1000 // arbitrary
  ) {
    res.status(400);
    res.send({ error: 'Bad search term' });
    return;
  }

  let limit = 20;
  if (req.query.limit && typeof req.query.limit === 'string') {
    limit = parseInt(req.query.limit, 10) || 20;
  }

  let offset = 0;
  if (req.query.offset && typeof req.query.offset === 'string') {
    offset = parseInt(req.query.offset, 10) || 0;
  }

  const searchTerm = req.query.s;
  const searchEmbedding = await createEmbedding(searchTerm);
  if (!searchEmbedding) {
    res.status(500);
    res.send(JSON.stringify({ error: 'Failed to fetch search embedding' }));
    return;
  }

  const scores = computeEmbeddingScores(searchEmbedding.data[0].embedding, {
    docs: true,
    cordDotCom: true,
  });

  // Filter out URLs that were returned multiple times
  const seenURLs = new Set<string>();
  const deduped: EmbeddingScore[] = [];
  for (const score of scores) {
    if (!seenURLs.has(score.url)) {
      deduped.push(score);
      seenURLs.add(score.url);
    }
  }

  res.status(200);
  res.send(
    JSON.stringify(
      deduped.slice(offset, offset + limit).map((embeddingScore) => ({
        ...embeddingScore,
        // For the search results, arbitrarily trim them down a bit.
        plainText: despace(embeddingScore.plainText).substring(0, 200),
      })),
    ),
  );

  if (Env.CORD_DOCS_SEARCH_SLACK_CHANNEL_ID) {
    let { ref } = req.query;
    if (typeof ref !== 'string') {
      ref = 'Unexpected ref: ' + JSON.stringify(ref);
    }

    let location = req.ip;
    try {
      location = await ipToLocation(req.ip);
    } catch (e) {
      console.log('Failed to fetch geo IP info for IP ' + req.ip, e);
    }

    await sendMessageToCord(
      `(${location}) Query: \`${escapeForSlack(searchTerm)}\`\n` +
        `Referring page: ${escapeForSlack(ref)}\n` +
        `(offset: ${escapeForSlack(offset.toString())}, limit: ${escapeForSlack(
          limit.toString(),
        )})`,
      Env.CORD_DOCS_SEARCH_SLACK_CHANNEL_ID,
    );
  }
};

export default SearchAPI;
