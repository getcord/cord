import { JSDOM } from 'jsdom';
import { isEqual } from '@cord-sdk/react/common/lib/fast-deep-equal.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getDetailsForURLWithProvider } from 'common/page_context/index.ts';
import { cleanupURL } from 'common/page_context/util.ts';
export const providerRuleTestResolver: Resolvers['ProviderRuleTest'] = {
  result: async (ruleTest, _args, context) => {
    const provider = await context.loaders.providerLoader.loadRuleProvider(
      ruleTest.providerID,
    );

    const document = ruleTest.documentHTML
      ? new JSDOM(ruleTest.documentHTML).window.document
      : undefined;

    const matchResult = getDetailsForURLWithProvider(
      cleanupURL(ruleTest.url),
      provider!,
      document,
    );

    const passes =
      (matchResult.match === 'allow') ===
        (ruleTest.expectedMatch === 'allow') &&
      matchResult.pageName === ruleTest.expectedName &&
      isEqual(matchResult.pageContext.data, ruleTest.expectedContextData);

    return {
      passes,
      ruleID: ruleTest.id,
      ...matchResult,
    };
  },
};
