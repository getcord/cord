import type { Resolvers } from 'server/src/schema/resolverTypes.ts';

export const applicationQueryResolver: Resolvers['Query']['application'] =
  async (_, _args, context) => {
    const { platformApplicationID, externalUserID, externalOrgID } =
      context.session.viewer;

    if (!platformApplicationID || !externalUserID) {
      return null;
    }

    const application = await context.loaders.applicationLoader.load(
      platformApplicationID,
    );
    if (!application) {
      return null;
    }

    const fillInBlanks = (linkWithPlaceholders?: string | null) => {
      if (!linkWithPlaceholders) {
        return null;
      }
      return linkWithPlaceholders
        .replace(/{{USER_ID}}/g, externalUserID)
        .replace(/{{ORGANIZATION_ID}}/g, externalOrgID ?? '')
        .replace(/{{ORGANISATION_ID}}/g, externalOrgID ?? '');
    };

    const links = {
      learnMore: fillInBlanks(application.customLinks?.learnMore),
      upgradePlan: fillInBlanks(application.customLinks?.upgradePlan),
      leaveFeedback: fillInBlanks(application.customLinks?.leaveFeedback),
    };

    return {
      id: application.id,
      name: application.name,
      customLinks: links,
      segmentWriteKey: application.segmentWriteKey,
      customNUX: application.customNUX,
      iconURL: application.iconURL,
      environment: application.environment,
    };
  };
