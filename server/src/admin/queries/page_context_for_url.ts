import {
  findRuleProviderForURL,
  getDetailsForURLWithProvider,
} from 'common/page_context/index.ts';
import { cleanupURL } from 'common/page_context/util.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';

export const pageContextForURLQueryResolver: Resolvers['Query']['pageContextForURL'] =
  async (_, args, context) => {
    const { url } = args;

    const { ruleProviders } =
      await context.loaders.providerLoader.loadAllRuleProviders();

    const provider = findRuleProviderForURL(cleanupURL(url), ruleProviders);

    if (!provider) {
      return {
        match: 'none',
        matchedRuleID: null,
        pageContext: null,
        pageName: null,
      };
    }

    const matchResult = getDetailsForURLWithProvider(cleanupURL(url), provider);

    if (matchResult.match === 'none') {
      return {
        match: 'none',
        matchedRuleID: null,
        pageContext: matchResult.pageContext,
        pageName: matchResult.pageName,
      };
    } else {
      return {
        match: matchResult.match,
        matchedRuleID: matchResult.ruleID,
        pageContext: matchResult.pageContext,
        pageName: matchResult.pageName,
      };
    }
  };
