import { GraphQLScalarType } from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import type { ValueNode } from 'graphql';

import type { AnnotationAttachmentInput } from 'server/src/schema/resolverTypes.ts';
import type { MessageAnnotationAttachmentData } from 'server/src/entity/message_attachment/MessageAttachmentEntity.ts';
import type { RequestContext } from 'server/src/RequestContext.ts';
import type {
  UUID,
  MessageContent,
  ElementIdentifierVersion,
  JsonValue,
  HighlightedTextConfig,
} from 'common/types/index.ts';
import {
  MessageAttachmentType,
  parseElementIdentifierVersion,
  isValidFlatJsonObject,
} from 'common/types/index.ts';
import { MessageMentionMutator } from 'server/src/entity/message_mention/MessageMentionMutator.ts';
import { getMentionedUserIDs } from 'common/util/index.ts';
import { Logger } from 'server/src/logging/Logger.ts';
import type { Viewer } from 'server/src/auth/index.ts';

// createOrUpdateMessageMentions updates message mentions for the given
// messageID to match the mentions in the content. A list of newly mentioned
// user IDs is returned.
async function createOrUpdateMessageMentions(
  context: RequestContext,
  messageId: UUID,
  content: MessageContent,
  isUpdate: boolean,
): Promise<UUID[]> {
  const mentionedUsers: UUID[] = getMentionedUserIDs(content);

  const mutator = new MessageMentionMutator(context.session.viewer);

  if (isUpdate) {
    // delete existing mentions that are not contained in the updated
    // version of the message
    await mutator.deleteExcludingUsers(messageId, mentionedUsers);
  }

  // create mentions in database - any messageID/userID combination that is
  // already present in the table will not be returned, i.e.
  // `createdMentions` only includes actually newly created rows
  return await mutator.createMessageMentions(messageId, mentionedUsers);
}

export const createMessageMentions = (
  context: RequestContext,
  messageId: UUID,
  content: MessageContent,
) => createOrUpdateMessageMentions(context, messageId, content, false);

export const updateMessageMentions = (
  context: RequestContext,
  messageId: UUID,
  content: MessageContent,
) => createOrUpdateMessageMentions(context, messageId, content, true);

export const getMessageAnnotationAttachmentsFromInput = (
  viewer: Viewer,
  annotationAttachments: AnnotationAttachmentInput[],
): Array<{
  id: UUID;
  type: MessageAttachmentType.ANNOTATION;
  data: MessageAnnotationAttachmentData;
}> => {
  // double check that we don't receive annotations with both location and customLocation
  const attachmentWithBothLocations = annotationAttachments.find(
    (annotation) => annotation.location && annotation.customLocation,
  );
  if (attachmentWithBothLocations) {
    new Logger(viewer).warn(
      'AnnotationAttachmentInput contains both location and customLocation',
      { attachment: attachmentWithBothLocations },
    );
  }

  return annotationAttachments.map(
    ({
      id,
      screenshotFileID,
      blurredScreenshotFileID,
      location,
      customLocation,
      customHighlightedTextConfig,
      customLabel,
      coordsRelativeToTarget,
    }) => ({
      id,
      type: MessageAttachmentType.ANNOTATION,
      data: {
        screenshotFileID: screenshotFileID ?? null,
        blurredScreenshotFileID: blurredScreenshotFileID ?? null,
        location: location ?? null,
        customLocation: customLocation ?? null,
        customHighlightedTextConfig:
          customHighlightedTextConfig as HighlightedTextConfig,
        customLabel: customLabel ?? null,
        coordsRelativeToTarget: coordsRelativeToTarget ?? null,
      },
    }),
  );
};

export const SimpleValueScalarType = new GraphQLScalarType({
  name: 'SimpleValue',
  description: 'Simple value',

  // serialization/deserialization works just like for JSON
  serialize: GraphQLJSON.serialize,
  parseValue: GraphQLJSON.parseValue,
  parseLiteral: GraphQLJSON.parseLiteral,
});

export const MessageContentScalarType = new GraphQLScalarType({
  name: 'MessageContent',
  description: 'Message content',

  // serialization/deserialization works just like for JSON
  serialize: GraphQLJSON.serialize,
  parseValue: GraphQLJSON.parseValue,
  parseLiteral: GraphQLJSON.parseLiteral,
});

/**
 * A JSONObject where all values are string, number or boolean.
 *
 * This object is exported for use in other scalar types. You probably don't
 * want to use this type directly; use the `Context` or `Metadata` scalar types
 * instead.
 */
const FlatJSONObjectScalarType = new GraphQLScalarType({
  name: 'FlatJSONObject',
  description: 'A JSONObject where all values are string, number or boolean',

  // serialization/deserialization works just like for JSON, with further
  // validation
  serialize: GraphQLJSON.serialize,
  parseValue: (value) => {
    const result = GraphQLJSON.parseValue(value);
    if (!isValidFlatJsonObject(result)) {
      throw new Error('Invalid flat JSON object');
    }
    return result;
  },
  parseLiteral: (astNode, variables) => {
    const result = GraphQLJSON.parseLiteral(astNode, variables);
    if (!isValidFlatJsonObject(result)) {
      throw new Error('Invalid flat JSON object');
    }
    return result;
  },
});

export const ContextScalarType = new GraphQLScalarType({
  ...FlatJSONObjectScalarType,
  name: 'Context',
  description: 'Context',
});

export const MetadataScalarType = new GraphQLScalarType({
  ...FlatJSONObjectScalarType,
  name: 'Metadata',
  description: 'Metadata',
});

export const SimpleTranslationParametersScalarType = new GraphQLScalarType({
  ...FlatJSONObjectScalarType,
  name: 'SimpleTranslationParameters',
  description: 'SimpleTranslationParameters',
});

export const ElementIdentifierVersionScalarType = new GraphQLScalarType({
  name: 'ElementIdentifierVersion',

  serialize: (x: ElementIdentifierVersion) => x, // already JSON serializable
  parseValue: (x: JsonValue) => {
    if (typeof x !== 'string') {
      return null;
    }
    return parseElementIdentifierVersion(x);
  },
  parseLiteral: (astNode: ValueNode) => {
    if (astNode.kind === 'StringValue') {
      return parseElementIdentifierVersion(astNode.value);
    }
    return null;
  },
});

export const JsonObjectReducerDataScalarType = new GraphQLScalarType({
  name: 'JsonObjectReducerData',
  description: 'Data type for jsonObjectReducer',

  // serialization/deserialization works just like for JSON
  serialize: GraphQLJSON.serialize,
  parseValue: GraphQLJSON.parseValue,
  parseLiteral: GraphQLJSON.parseLiteral,
});
