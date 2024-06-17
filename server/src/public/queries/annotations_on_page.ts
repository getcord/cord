import type { UUID } from 'common/types/index.ts';
import { toPageContext } from 'common/types/index.ts';
import type { Resolvers } from 'server/src/schema/resolverTypes.ts';
import { getPageContextHash } from 'server/src/util/hash.ts';
import { assertViewerHasIdentity } from 'server/src/auth/index.ts';
import { UserHiddenAnnotationsEntity } from 'server/src/entity/user_hidden_annotations/UserHiddenAnnotationsEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';

export const annotationsOnPageQueryResolver: Resolvers['Query']['annotationsOnPage'] =
  async (_, { pageContext, includeDeleted = false }, context) => {
    const { orgID, userID } = assertViewerHasIdentity(context.session.viewer);
    const [pageContextHash] = getPageContextHash(toPageContext(pageContext));
    return await getAnnotationsOnPage(
      context,
      pageContextHash,
      userID,
      orgID,
      includeDeleted ?? false,
    );
  };

export async function getAnnotationsOnPage(
  context: RequestContext,
  pageContextHash: UUID,
  userID: UUID,
  orgID: UUID,
  includeDeleted: boolean,
) {
  const allAnnotationsOnPage =
    await context.loaders.messageAttachmentLoader.loadAnnotationAttachmentsOnPage(
      pageContextHash,
      includeDeleted,
    );

  if (allAnnotationsOnPage.length === 0) {
    return { allAnnotations: [], hiddenAnnotationIDs: [] };
  }

  const annotationsHiddenByUser = await UserHiddenAnnotationsEntity.findAll({
    where: { userID, orgID, pageContextHash },
  });
  const hiddenAnnotationIDs = annotationsHiddenByUser.map(
    (value) => value.annotationID,
  );

  return { allAnnotations: allAnnotationsOnPage, hiddenAnnotationIDs };
}
