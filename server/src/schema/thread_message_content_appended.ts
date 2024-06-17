import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const threadMessageContentAppendedResolver: Resolvers['ThreadMessageContentAppended'] =
  {
    id: ({ payload: { messageID } }, _, _context) => messageID,
    appendedContent: ({ payload: { appendedContent } }, _, _context) =>
      appendedContent,
  };
