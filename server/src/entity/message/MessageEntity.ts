import {
  Table,
  Column,
  PrimaryKey,
  Model,
  DefaultScope,
} from 'sequelize-typescript';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { DataTypes, Sequelize } from 'sequelize';
import { MessageNodeType } from 'common/types/index.ts';
import type {
  UUID,
  MessageContent,
  ImportedSlackMessageType,
  MessageType,
  EntityMetadata,
  MessageNode,
} from 'common/types/index.ts';
import { isDefined } from 'common/util/index.ts';

@DefaultScope(() => ({
  attributes: {
    include: [
      [
        // We're sorting on this, so the format matters, and sorting alphabetically equals sorting chronologically.
        Sequelize.literal('TO_CHAR("timestamp", \'YYYY-MM-DD HH24:MI:SS.US\')'),
        'createdAtWithMicros',
      ],
    ],
  },
}))
@Table({
  tableName: 'messages',
  timestamps: false,
})
export class MessageEntity extends Model<
  InferAttributes<MessageEntity>,
  InferCreationAttributes<MessageEntity>
> {
  @PrimaryKey
  @Column({
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
  })
  id!: UUID;

  @Column({ type: DataTypes.STRING })
  externalID!: CreationOptional<string>;

  @Column({
    type: DataTypes.UUID,
  })
  orgID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  threadID!: UUID;

  @Column({
    type: DataTypes.UUID,
    allowNull: false,
  })
  platformApplicationID!: UUID;

  @Column({
    type: DataTypes.UUID,
  })
  sourceID!: UUID;

  @Column({
    type: DataTypes.JSONB,
    get(): MessageContent {
      return cleanseMessageContent(this.getDataValue('content'));
    },
  })
  content!: MessageContent;

  @Column({
    type: DataTypes.TEXT,
  })
  url!: string | null;

  @Column({
    type: DataTypes.TIME,
  })
  timestamp!: CreationOptional<Date>;

  @Column({
    type: DataTypes.TIME,
  })
  deletedTimestamp!: Date | null;

  @Column({
    type: DataTypes.TIME,
  })
  lastUpdatedTimestamp!: Date | null;

  @Column({
    type: DataTypes.TEXT,
  })
  importedSlackChannelID!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  importedSlackMessageTS!: string | null;

  @Column({
    type: DataTypes.ENUM('reply', 'supportBotReply'),
    defaultValue: null,
  })
  importedSlackMessageType!: ImportedSlackMessageType | null;

  @Column({
    type: DataTypes.TEXT,
  })
  importedSlackMessageThreadTS!: string | null;

  @Column({
    type: DataTypes.UUID,
    defaultValue: null,
  })
  replyToEmailNotificationID!: UUID | null;

  // Unto all those who wend near this line of code, hear me!
  // If you add more things to this list instead of migrating it
  // into a metadata value, a curse be upon ye!
  @Column({
    type: DataTypes.ENUM('action_message', 'user_message'),
    defaultValue: 'user_message',
  })
  type!: CreationOptional<MessageType>;

  @Column({
    type: DataTypes.TEXT,
  })
  iconURL!: string | null;

  @Column({
    type: DataTypes.TEXT,
  })
  translationKey!: string | null;

  @Column({
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: CreationOptional<EntityMetadata>;

  @Column({
    type: DataTypes.TEXT,
    defaultValue: '',
  })
  extraClassnames!: string;

  @Column({
    type: DataTypes.TSVECTOR,
  })
  contentTsVector!: string | null;

  @Column({
    type: DataTypes.VIRTUAL,
  })
  createdAtWithMicros!: CreationOptional<string>;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  skipLinkPreviews!: CreationOptional<boolean>;

  isDeleted() {
    return this.deletedTimestamp !== null;
  }
}

// This section contains old node types that no longer matter.  To remove a node
// type, copy all the relevant definitions from messageNodes.ts to here and
// prefix them with Legacy, then apply the appropriate code inside `cleanseNode`
// to convert them to supported node types.

enum LegacyMessageNodeType {
  ANNOTATION = 'annotation',
  LINK_DEPRECATED = 'a',
}

type LegacyMessageNodeBase = {
  type?: LegacyMessageNodeType;
  class?: string;
};

type LegacyMessageNodeWithChildren = LegacyMessageNodeBase & {
  children: LegacyMessageContent;
};

type LegacyMessageAnnotationNode = LegacyMessageNodeWithChildren & {
  type: LegacyMessageNodeType.ANNOTATION;
  annotation: {
    id: UUID;
  };
};

export type LegacyMessageLinkDeprecatedNode = LegacyMessageNodeBase & {
  type: LegacyMessageNodeType.LINK_DEPRECATED;
  text: string;
  url: string;
};

type LegacyMessageNode =
  | MessageNode
  | LegacyMessageAnnotationNode
  | LegacyMessageLinkDeprecatedNode;

type LegacyMessageContent = LegacyMessageNode[];

function cleanseMessageContent(
  // Even though this column isn't nullable, Sequelize might not have loaded it
  // because it only loaded a subset of columns, so we might get undefined
  content: LegacyMessageContent | undefined,
): MessageContent {
  if (!content) {
    return [];
  }
  return content.map(cleanseNode).filter(isDefined);
}

function cleanseNode(node: LegacyMessageNode): MessageNode | undefined {
  if (node.type === LegacyMessageNodeType.ANNOTATION) {
    return undefined;
  } else if (node.type === LegacyMessageNodeType.LINK_DEPRECATED) {
    return {
      type: MessageNodeType.LINK,
      url: node.url,
      children: [{ text: node.text }],
    };
  }
  if ('children' in node) {
    return {
      ...node,
      children: cleanseMessageContent(node.children),
    };
  }
  return node;
}
