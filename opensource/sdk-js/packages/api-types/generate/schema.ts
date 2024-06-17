// @generated
export default {
  CreateApplicationVariables: {
    description: 'https://docs.cord.com/rest-apis/applications/',
    type: 'object',
    properties: {
      emailSettings: { $ref: '#/definitions/Partial<EmailSettings>' },
      name: {
        description: 'Name of the project',
        minLength: 1,
        type: 'string',
      },
      iconURL: {
        description:
          'URL for the project icon. It should be a square image of 256x256. This\nwill be used as the avatar for messages and emails coming from your\nproject.  If not specified, the Cord logo will be used.',
        format: 'uri',
        type: ['null', 'string'],
      },
      eventWebhookURL: {
        description: 'The URL that the events webhook is sent to',
        format: 'uri',
        type: ['null', 'string'],
      },
      redirectURI: {
        description:
          'Custom url link contained in email and slack notifications. These notifications are sent when a user is\nmentioned or thread is shared and by default, the link points to the page where the conversation happened.\nFor more information, please refer to the [API docs](/customization/redirect-link)',
        type: ['null', 'string'],
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'emailSettings',
      'name',
      'iconURL',
      'eventWebhookURL',
      'redirectURI',
    ],
    required: ['name'],
    definitions: {
      'Partial<EmailSettings>': {
        type: 'object',
        properties: {
          name: {
            description:
              "Name to show in both the subject and the body of the email.\nDefaults to your project's name.",
            type: ['null', 'string'],
          },
          imageURL: {
            description:
              'URL for your logo image. The default for this is the Cord logo.',
            type: ['null', 'string'],
          },
          sender: {
            description:
              'Email from which notifications for your service will be sent from.\nThis will use the provided name for your project to default to `<projectname>-notifications@cord.fyi`.',
            format: 'email',
            type: ['null', 'string'],
          },
          logoConfig: {
            description:
              'Customization for your logo size. Providing either a height (maximum 120) or\nwidth (maximum 240) will result in the image being proportionally resized to\nfit in a container of that size. The default value is `{"width": 140}`.',
            anyOf: [
              {
                type: 'object',
                properties: {
                  width: { minimum: 0, maximum: 240, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['width'],
                required: ['width'],
              },
              {
                type: 'object',
                properties: {
                  height: { minimum: 0, maximum: 120, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['height'],
                required: ['height'],
              },
              { type: 'null' },
            ],
          },
          enableEmailNotifications: {
            description:
              'Whether you want your users to receive notification emails. The default value is true.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'name',
          'imageURL',
          'sender',
          'logoConfig',
          'enableEmailNotifications',
        ],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdateApplicationVariables: {
    description: 'https://docs.cord.com/rest-apis/applications/',
    type: 'object',
    properties: {
      emailSettings: { $ref: '#/definitions/Partial<EmailSettings>' },
      name: {
        description: 'Name of the project',
        minLength: 1,
        type: 'string',
      },
      iconURL: {
        description:
          'URL for the project icon. It should be a square image of 256x256. This\nwill be used as the avatar for messages and emails coming from your\nproject.  If not specified, the Cord logo will be used.',
        format: 'uri',
        type: ['null', 'string'],
      },
      eventWebhookURL: {
        description: 'The URL that the events webhook is sent to',
        format: 'uri',
        type: ['null', 'string'],
      },
      redirectURI: {
        description:
          'Custom url link contained in email and slack notifications. These notifications are sent when a user is\nmentioned or thread is shared and by default, the link points to the page where the conversation happened.\nFor more information, please refer to the [API docs](/customization/redirect-link)',
        type: ['null', 'string'],
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'emailSettings',
      'name',
      'iconURL',
      'eventWebhookURL',
      'redirectURI',
    ],
    definitions: {
      'Partial<EmailSettings>': {
        type: 'object',
        properties: {
          name: {
            description:
              "Name to show in both the subject and the body of the email.\nDefaults to your project's name.",
            type: ['null', 'string'],
          },
          imageURL: {
            description:
              'URL for your logo image. The default for this is the Cord logo.',
            type: ['null', 'string'],
          },
          sender: {
            description:
              'Email from which notifications for your service will be sent from.\nThis will use the provided name for your project to default to `<projectname>-notifications@cord.fyi`.',
            format: 'email',
            type: ['null', 'string'],
          },
          logoConfig: {
            description:
              'Customization for your logo size. Providing either a height (maximum 120) or\nwidth (maximum 240) will result in the image being proportionally resized to\nfit in a container of that size. The default value is `{"width": 140}`.',
            anyOf: [
              {
                type: 'object',
                properties: {
                  width: { minimum: 0, maximum: 240, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['width'],
                required: ['width'],
              },
              {
                type: 'object',
                properties: {
                  height: { minimum: 0, maximum: 120, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['height'],
                required: ['height'],
              },
              { type: 'null' },
            ],
          },
          enableEmailNotifications: {
            description:
              'Whether you want your users to receive notification emails. The default value is true.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'name',
          'imageURL',
          'sender',
          'logoConfig',
          'enableEmailNotifications',
        ],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  DeleteApplicationVariables: {
    description: 'https://docs.cord.com/rest-apis/applications/',
    type: 'object',
    properties: {
      secret: {
        description:
          'Secret key of the project that you want to delete. This can be found\nwithin the Cord Console.',
        minLength: 1,
        type: 'string',
      },
    },
    additionalProperties: false,
    propertyOrder: ['secret'],
    required: ['secret'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  BatchAPIVariables: {
    description: 'https://docs.cord.com/rest-apis/batch/',
    type: 'object',
    properties: {
      users: {
        description:
          'List of user objects. Every object must include the id field. If the user\nalready exists, all other fields are optional and only updated when\npresent. If the user does not already exist, fields are required as\ndescribed in the [Create or update a\nuser](/rest-apis/users#Create-or-update-a-user)\nAPI.',
        maxItems: 10000,
        type: 'array',
        items: { $ref: '#/definitions/BatchUpdateUser' },
      },
      organizations: {
        maxItems: 1000,
        type: 'array',
        items: { $ref: '#/definitions/BatchUpdateGroup' },
      },
      groups: {
        description:
          'List of group objects. Every object must include the id field. If\nthe group already exists, all other fields are optional and only\nupdated when present. If the group does not already exist, fields\nare required as described in the [Create or update a\ngroup](/rest-apis/groups/#create-or-update-a-group)\nAPI.',
        maxItems: 1000,
        type: 'array',
        items: { $ref: '#/definitions/BatchUpdateGroup' },
      },
    },
    additionalProperties: false,
    propertyOrder: ['users', 'organizations', 'groups'],
    definitions: {
      BatchUpdateUser: {
        additionalProperties: false,
        type: 'object',
        properties: {
          name: { description: 'Full user name', type: ['null', 'string'] },
          metadata: {
            description:
              'Arbitrary key-value pairs that can be used to store additional information.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          status: { enum: ['active', 'deleted'], type: 'string' },
          email: {
            description: 'Email address',
            format: 'email',
            type: ['null', 'string'],
          },
          shortName: {
            description:
              'Short user name. In most cases, this will be preferred over name when set.',
            type: ['null', 'string'],
          },
          short_name: { type: ['null', 'string'] },
          profilePictureURL: {
            description:
              "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
            format: 'uri',
            type: ['null', 'string'],
          },
          profile_picture_url: {
            description:
              'Alias for profilePictureURL. This field is deprecated.',
            format: 'uri',
            type: ['null', 'string'],
          },
          first_name: {
            description:
              "User's first name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
          last_name: {
            description:
              "User's last name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
          id: { $ref: '#/definitions/ID' },
        },
        required: ['id'],
      },
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
      BatchUpdateGroup: {
        additionalProperties: false,
        type: 'object',
        properties: {
          name: {
            description: 'Group name. Required when creating an group.',
            type: 'string',
          },
          metadata: {
            description:
              'Arbitrary key-value pairs that can be used to store additional information.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          status: {
            description:
              'Whether this group is active or deleted.  Attempting to log into a\ndeleted group will fail.',
            enum: ['active', 'deleted'],
            type: 'string',
          },
          members: {
            description:
              'List of partner-specific IDs of the users who are members of this group.\nThis will replace the existing members.',
            type: 'array',
            items: { $ref: '#/definitions/ID' },
          },
          id: { $ref: '#/definitions/ID' },
        },
        required: ['id'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreateFileVariables: {
    type: 'object',
    properties: {
      ownerID: {
        description:
          'The ID of the user that owns the file.  Files can only be attached to\nmessages authored by their owner.',
        type: 'string',
      },
      name: {
        description:
          "The name of the file.  This will be shown to the user when attached to a\nmessage and will be the file's name if it's downloaded.  If not supplied,\nit will be taken from the filename of the `file` parameter.",
        type: 'string',
      },
    },
    additionalProperties: false,
    propertyOrder: ['ownerID', 'name'],
    required: ['ownerID'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreateMessageVariables: {
    description: 'https://docs.cord.com/rest-apis/messages/',
    type: 'object',
    properties: {
      addReactions: {
        description:
          'The reactions you want to add to this message.\nThe default timestamp is the current time.\nTrying to create a reaction that already exists for a user does nothing.\nDoing the same as before with a timestamp will update the reaction with the new timestamp.\nThe reaction users need to be an [active member of the group](/rest-apis/groups#Update-group-members) that the message and thread belong to.',
        type: 'array',
        items: { $ref: '#/definitions/ServerAddReactions' },
      },
      addAttachments: {
        description:
          'A list of attachments to add to the message.  The same file cannot be\nattached to the same message multiple times.',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              description:
                'The type of attachment.  This is `file` for file attachments.',
              type: 'string',
              const: 'file',
            },
            id: {
              description:
                'The ID of the file to attach.  This must have been previously uploaded via\nthe [file API](/js-apis-and-hooks/file-api/uploadFile).',
              type: 'string',
            },
          },
          additionalProperties: false,
          propertyOrder: ['type', 'id'],
          required: ['id', 'type'],
        },
      },
      createThread: {
        description:
          "The parameters for creating a thread if the supplied thread doesn't exist\nyet.  If the thread doesn't exist but `createThread` isn't provided, the\ncall will generate an error.  This value is ignored if the thread already\nexists.",
        $ref: '#/definitions/Omit<ServerCreateThread,"id">',
      },
      subscribeToThread: {
        description:
          "Whether to subscribe the sender of the message to the thread, so that they\nget notified about replies.  If not specified, defaults to `true`.  If\nfalse, the user's subscription status will be left unchanged.",
        type: 'boolean',
      },
      content: {
        $ref: '#/definitions/MessageContent',
        description: 'The content of the message.',
      },
      authorID: {
        description: 'The ID for the user that sent the message.',
        type: 'string',
      },
      type: {
        description:
          'The type of message this is.  A `user_message` is a message that the author\nsent.  An `action_message` is a message about something that happened, such\nas the thread being resolved.  The default value is `user_message`.',
        enum: ['action_message', 'user_message'],
        type: 'string',
      },
      id: {
        description:
          'The ID for the message.  If a message is created with no ID, a random\nUUID-based ID will be automatically created for it.',
        type: 'string',
      },
      url: {
        description:
          "A URL where the message can be seen.  This determines where a user is sent\nwhen they click on a reference to this message, such as in a notification.\nIf unset, it defaults to the thread's URL.",
        type: ['null', 'string'],
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      createdTimestamp: {
        description:
          'The timestamp when this message was created.  The default value is the\ncurrent time.',
        type: 'string',
        format: 'date-time',
      },
      extraClassnames: {
        description:
          'A optional space separated list of classnames to add to the message.',
        type: ['null', 'string'],
      },
      updatedTimestamp: {
        description:
          'The timestamp when this message was last edited, if it ever was.  If unset,\nthe message does not show as edited.',
        anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
      },
      deletedTimestamp: {
        description:
          'The timestamp when this message was deleted, if it was.  If unset, the\nmessage is not deleted.',
        anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
      },
      iconURL: {
        description:
          'The URL of the icon to show next to the message.  This is only used for\n`action_message` messages; other messages show the avatar of the author.\nIf an `action_message` does not have an icon set, no icon is shown.',
        format: 'uri',
        type: ['null', 'string'],
      },
      translationKey: {
        description:
          'An optional translation key used for this message.  This is useful for\nsystem-generated messages where you might want to translate or customize\nthem at runtime.  See [the translations\ndocumentation](/customization/translations) for more\ninformation.',
        type: ['null', 'string'],
      },
      skipLinkPreviews: {
        description:
          "If set, Cord won't analyze links in the message to generate previews.",
        type: 'boolean',
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'addReactions',
      'addAttachments',
      'createThread',
      'subscribeToThread',
      'content',
      'authorID',
      'type',
      'id',
      'url',
      'metadata',
      'createdTimestamp',
      'extraClassnames',
      'updatedTimestamp',
      'deletedTimestamp',
      'iconURL',
      'translationKey',
      'skipLinkPreviews',
    ],
    required: ['authorID', 'content'],
    definitions: {
      ServerAddReactions: {
        additionalProperties: false,
        type: 'object',
        properties: {
          reaction: { description: 'The emoji reaction.', type: 'string' },
          userID: {
            description: 'The ID of the user who reacted to the message.',
            type: 'string',
          },
          timestamp: {
            description: 'The timestamp of when the reaction was created.',
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['reaction', 'userID'],
      },
      'Omit<ServerCreateThread,"id">': {
        type: 'object',
        properties: {
          location: {
            description: 'The [location](/reference/location) of this thread.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          url: {
            description:
              "A URL where the thread can be seen.  This determines where a user is sent\nwhen they click on a reference to this thread, such as in a notification,\nor if they click on a reference to a message in the thread and the message\ndoesn't have its own URL.",
            type: 'string',
          },
          name: {
            description:
              'The name of the thread.  This is shown to users when the thread is\nreferenced, such as in notifications.  This should generally be something\nlike the page title.',
            type: 'string',
          },
          metadata: {
            description:
              'Arbitrary key-value pairs that can be used to store additional information.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          resolved: { type: 'boolean' },
          organizationID: {
            description: 'The organization ID this thread is in.',
            type: 'string',
          },
          groupID: {
            description: 'The group ID this thread is in.',
            type: 'string',
          },
          extraClassnames: {
            description:
              'An optional space separated list of classnames to add to the thread.',
            type: ['null', 'string'],
          },
          addSubscribers: {
            description: 'A list of subscribers to add to this thread.',
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'location',
          'url',
          'name',
          'metadata',
          'resolved',
          'organizationID',
          'groupID',
          'extraClassnames',
          'addSubscribers',
        ],
        required: ['groupID', 'location', 'name', 'url'],
      },
      MessageAnyNode: {
        anyOf: [
          { $ref: '#/definitions/MessageAssigneeNode' },
          { $ref: '#/definitions/MessageBulletNode' },
          { $ref: '#/definitions/MessageCodeNode' },
          { $ref: '#/definitions/MessageLinkNode' },
          { $ref: '#/definitions/MessageMentionNode' },
          { $ref: '#/definitions/MessageNumberBulletNode' },
          { $ref: '#/definitions/MessageParagraphNode' },
          { $ref: '#/definitions/MessageQuoteNode' },
          { $ref: '#/definitions/MessageTextNode' },
          { $ref: '#/definitions/MessageTodoNode' },
          { $ref: '#/definitions/MessageMarkdownNode' },
        ],
      },
      MessageAssigneeNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'assignee' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          user: {
            type: 'object',
            properties: { id: { type: 'string' } },
            additionalProperties: false,
            propertyOrder: ['id'],
            required: ['id'],
          },
        },
        required: ['children', 'type', 'user'],
      },
      MessageContent: {
        type: 'array',
        items: { $ref: '#/definitions/MessageAnyNode' },
      },
      MessageBulletNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'bullet' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          indent: { type: 'number' },
        },
        required: ['children', 'type'],
      },
      MessageCodeNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'code' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      MessageLinkNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'link' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          url: { type: 'string' },
        },
        required: ['children', 'type', 'url'],
      },
      MessageMentionNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'mention' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          user: {
            type: 'object',
            properties: { id: { type: 'string' } },
            additionalProperties: false,
            propertyOrder: ['id'],
            required: ['id'],
          },
        },
        required: ['children', 'type', 'user'],
      },
      MessageNumberBulletNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'number_bullet' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          bulletNumber: { type: 'number' },
          indent: { type: 'number' },
        },
        required: ['bulletNumber', 'children', 'type'],
      },
      MessageParagraphNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'p' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      MessageQuoteNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'quote' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      MessageTextNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: {
            enum: [
              'assignee',
              'bullet',
              'code',
              'link',
              'markdown',
              'mention',
              'number_bullet',
              'p',
              'quote',
              'todo',
            ],
            type: 'string',
          },
          class: { type: 'string' },
          text: { type: 'string' },
          bold: { type: 'boolean' },
          code: { type: 'boolean' },
          italic: { type: 'boolean' },
          underline: { type: 'boolean' },
        },
        required: ['text'],
      },
      MessageTodoNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'todo' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          todoID: { type: 'string' },
          done: { type: 'boolean' },
        },
        required: ['children', 'done', 'todoID', 'type'],
      },
      MessageMarkdownNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'markdown' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdateMessageVariables: {
    description: 'https://docs.cord.com/rest-apis/messages/',
    type: 'object',
    properties: {
      deleted: {
        description:
          'Whether we want to mark this message as deleted. Setting this to `true` without\nproviding a value for `deletedTimestamp` is equivalent to setting `deletedTimestamp` to current\ntime and setting this to `false` is equivalent to setting `deletedTimestamp` to `null`.',
        type: 'boolean',
      },
      deletedTimestamp: {
        description:
          "The timestamp when this message was deleted, if it was. If set to null, the message is not deleted.\nDeleting a message this way will only soft delete it, replacing the content of the message with a\nrecord of the deletion on the frontend. If you'd like to permanently delete it instead, use the\n[delete message endpoint](/rest-apis/messages#Delete-a-message).",
        anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
      },
      removeReactions: {
        description:
          'The reactions you want to remove from this message.\nRemoving a reaction that does not exist will have no effect and will not return an error.\nAn error is returned if a reaction is both added and deleted in the same request.',
        type: 'array',
        items: { $ref: '#/definitions/ServerRemoveReactions' },
      },
      removeAttachments: {
        description:
          "The attachments you want to remove from this message.  Removing an\nattachment that doesn't exist has no effect and won't return an error.\nAttempting to add and remove the same attachment in one request is an\nerror.",
        type: 'array',
        items: { $ref: '#/definitions/RemoveAttachment' },
      },
      type: {
        description:
          'The type of message this is.  A `user_message` is a message that the author\nsent.  An `action_message` is a message about something that happened, such\nas the thread being resolved.  The default value is `user_message`.',
        enum: ['action_message', 'user_message'],
        type: 'string',
      },
      id: {
        description:
          'The ID for the message.  If a message is created with no ID, a random\nUUID-based ID will be automatically created for it.',
        type: 'string',
      },
      url: {
        description:
          "A URL where the message can be seen.  This determines where a user is sent\nwhen they click on a reference to this message, such as in a notification.\nIf unset, it defaults to the thread's URL.",
        type: ['null', 'string'],
      },
      content: {
        description: 'The content of the message.',
        $ref: '#/definitions/MessageContent',
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      createdTimestamp: {
        description:
          'The timestamp when this message was created.  The default value is the\ncurrent time.',
        type: 'string',
        format: 'date-time',
      },
      authorID: {
        description: 'The ID for the user that sent the message.',
        type: 'string',
      },
      extraClassnames: {
        description:
          'A optional space separated list of classnames to add to the message.',
        type: ['null', 'string'],
      },
      updatedTimestamp: {
        description:
          'The timestamp when this message was last edited, if it ever was.  If unset,\nthe message does not show as edited.',
        anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
      },
      iconURL: {
        description:
          'The URL of the icon to show next to the message.  This is only used for\n`action_message` messages; other messages show the avatar of the author.\nIf an `action_message` does not have an icon set, no icon is shown.',
        format: 'uri',
        type: ['null', 'string'],
      },
      translationKey: {
        description:
          'An optional translation key used for this message.  This is useful for\nsystem-generated messages where you might want to translate or customize\nthem at runtime.  See [the translations\ndocumentation](/customization/translations) for more\ninformation.',
        type: ['null', 'string'],
      },
      skipLinkPreviews: {
        description:
          "If set, Cord won't analyze links in the message to generate previews.",
        type: 'boolean',
      },
      addReactions: {
        description:
          'The reactions you want to add to this message.\nThe default timestamp is the current time.\nTrying to create a reaction that already exists for a user does nothing.\nDoing the same as before with a timestamp will update the reaction with the new timestamp.\nThe reaction users need to be an [active member of the group](/rest-apis/groups#Update-group-members) that the message and thread belong to.',
        type: 'array',
        items: { $ref: '#/definitions/ServerAddReactions' },
      },
      addAttachments: {
        description:
          'A list of attachments to add to the message.  The same file cannot be\nattached to the same message multiple times.',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              description:
                'The type of attachment.  This is `file` for file attachments.',
              type: 'string',
              const: 'file',
            },
            id: {
              description:
                'The ID of the file to attach.  This must have been previously uploaded via\nthe [file API](/js-apis-and-hooks/file-api/uploadFile).',
              type: 'string',
            },
          },
          additionalProperties: false,
          propertyOrder: ['type', 'id'],
          required: ['id', 'type'],
        },
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'deleted',
      'deletedTimestamp',
      'removeReactions',
      'removeAttachments',
      'type',
      'id',
      'url',
      'content',
      'metadata',
      'createdTimestamp',
      'authorID',
      'extraClassnames',
      'updatedTimestamp',
      'iconURL',
      'translationKey',
      'skipLinkPreviews',
      'addReactions',
      'addAttachments',
    ],
    definitions: {
      ServerRemoveReactions: {
        type: 'object',
        properties: {
          reaction: { description: 'The emoji reaction.', type: 'string' },
          userID: {
            description: 'The ID of the user who reacted to the message.',
            type: 'string',
          },
        },
        additionalProperties: false,
        propertyOrder: ['reaction', 'userID'],
        required: ['reaction', 'userID'],
      },
      RemoveAttachment: {
        anyOf: [
          {
            type: 'object',
            properties: {
              type: {
                description:
                  'The type of attachment to remove.  This is `file` for file attachments.',
                type: 'string',
                const: 'file',
              },
              id: {
                description: 'The ID of the file attachment to remove.',
                type: 'string',
              },
            },
            additionalProperties: false,
            propertyOrder: ['type', 'id'],
            required: ['id', 'type'],
          },
          {
            type: 'object',
            properties: {
              type: {
                description:
                  'The type of attachment to remove.  This is `link_preview` for link preview attachments.',
                type: 'string',
                const: 'link_preview',
              },
              id: {
                description: 'The ID of the link preview attachment to remove.',
                type: 'string',
              },
            },
            additionalProperties: false,
            propertyOrder: ['type', 'id'],
            required: ['id', 'type'],
          },
        ],
      },
      MessageAnyNode: {
        anyOf: [
          { $ref: '#/definitions/MessageAssigneeNode' },
          { $ref: '#/definitions/MessageBulletNode' },
          { $ref: '#/definitions/MessageCodeNode' },
          { $ref: '#/definitions/MessageLinkNode' },
          { $ref: '#/definitions/MessageMentionNode' },
          { $ref: '#/definitions/MessageNumberBulletNode' },
          { $ref: '#/definitions/MessageParagraphNode' },
          { $ref: '#/definitions/MessageQuoteNode' },
          { $ref: '#/definitions/MessageTextNode' },
          { $ref: '#/definitions/MessageTodoNode' },
          { $ref: '#/definitions/MessageMarkdownNode' },
        ],
      },
      MessageAssigneeNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'assignee' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          user: {
            type: 'object',
            properties: { id: { type: 'string' } },
            additionalProperties: false,
            propertyOrder: ['id'],
            required: ['id'],
          },
        },
        required: ['children', 'type', 'user'],
      },
      MessageContent: {
        type: 'array',
        items: { $ref: '#/definitions/MessageAnyNode' },
      },
      MessageBulletNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'bullet' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          indent: { type: 'number' },
        },
        required: ['children', 'type'],
      },
      MessageCodeNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'code' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      MessageLinkNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'link' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          url: { type: 'string' },
        },
        required: ['children', 'type', 'url'],
      },
      MessageMentionNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'mention' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          user: {
            type: 'object',
            properties: { id: { type: 'string' } },
            additionalProperties: false,
            propertyOrder: ['id'],
            required: ['id'],
          },
        },
        required: ['children', 'type', 'user'],
      },
      MessageNumberBulletNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'number_bullet' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          bulletNumber: { type: 'number' },
          indent: { type: 'number' },
        },
        required: ['bulletNumber', 'children', 'type'],
      },
      MessageParagraphNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'p' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      MessageQuoteNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'quote' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      MessageTextNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: {
            enum: [
              'assignee',
              'bullet',
              'code',
              'link',
              'markdown',
              'mention',
              'number_bullet',
              'p',
              'quote',
              'todo',
            ],
            type: 'string',
          },
          class: { type: 'string' },
          text: { type: 'string' },
          bold: { type: 'boolean' },
          code: { type: 'boolean' },
          italic: { type: 'boolean' },
          underline: { type: 'boolean' },
        },
        required: ['text'],
      },
      MessageTodoNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'todo' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
          todoID: { type: 'string' },
          done: { type: 'boolean' },
        },
        required: ['children', 'done', 'todoID', 'type'],
      },
      MessageMarkdownNode: {
        additionalProperties: false,
        type: 'object',
        properties: {
          type: { type: 'string', const: 'markdown' },
          class: { type: 'string' },
          children: { $ref: '#/definitions/MessageContent' },
        },
        required: ['children', 'type'],
      },
      ServerAddReactions: {
        additionalProperties: false,
        type: 'object',
        properties: {
          reaction: { description: 'The emoji reaction.', type: 'string' },
          userID: {
            description: 'The ID of the user who reacted to the message.',
            type: 'string',
          },
          timestamp: {
            description: 'The timestamp of when the reaction was created.',
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['reaction', 'userID'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListThreadMessageParameters: {
    description: 'https://docs.cord.com/rest-apis/messages/',
    type: 'object',
    properties: {
      sortDirection: {
        description:
          "Return messages in ascending or descending order of creation timestamp.  'descending' is the default.",
        enum: ['ascending', 'descending'],
        type: 'string',
      },
    },
    additionalProperties: false,
    propertyOrder: ['sortDirection'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListMessageParameters: {
    description: 'https://docs.cord.com/rest-apis/messages/',
    type: 'object',
    properties: {
      limit: {
        description: 'Number of messages to return. Defaults to 1000.',
        type: 'number',
      },
      token: {
        description:
          'Pagination token. This is returned in the `pagination` object of a previous response.',
        type: 'string',
      },
      filter: {
        description:
          'Messages will be matched against the filters specified.\nThis is a partial match, which means any keys other than the ones you specify are ignored\nwhen checking for a match. Please note that because this is a query parameter in a REST API,\nthis JSON object must be URI encoded before being sent.',
        type: 'object',
        properties: {
          metadata: {
            description:
              'Arbitrary key-value pairs of data associated with the message.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          location: {
            description:
              'The [location](/reference/location) of the thread containing the message.',
            type: 'string',
          },
          authorID: {
            description:
              'If provided, will return messages created by this author.',
            type: 'string',
          },
        },
        additionalProperties: false,
        propertyOrder: ['metadata', 'location', 'authorID'],
      },
    },
    additionalProperties: false,
    propertyOrder: ['limit', 'token', 'filter'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  AppendMessageVariables: {
    type: 'object',
    properties: {
      text: {
        description:
          'The text that will be appended to the markdown node in the message.',
        type: 'string',
      },
    },
    additionalProperties: false,
    propertyOrder: ['text'],
    required: ['text'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreateNotificationVariables: {
    description: 'https://docs.cord.com/rest-apis/notifications/',
    type: 'object',
    properties: {
      actorID: {
        description:
          'ID of user who is the "actor" sending the notification, i.e., the user\ntaking the action the notification is about.\n\nRequired if `template` includes `{{actor}}`.',
        type: 'string',
      },
      actor_id: { type: 'string' },
      recipientID: {
        description: 'ID of user receiving the notification.',
        type: 'string',
      },
      recipient_id: { type: 'string' },
      template: {
        description:
          "Template for the header of the notification. The expressions `{{actor}}`\nand `{{recipient}}` will be replaced respectively with the notification's\nactor and recipient. (See below for an example.)",
        type: 'string',
      },
      url: {
        description: 'URL of page to go to when the notification is clicked.',
        type: 'string',
      },
      iconUrl: {
        description:
          "URL of an icon image if a specific one is desired. For notifications with\nan `actor_id` this will default to the sender's profile picture, otherwise\nit will default to a bell icon.",
        type: 'string',
      },
      type: {
        description:
          'Currently must be set to `url`. In the future this may specify different\ntypes of notifications, but for now only `url` is defined.',
        type: 'string',
        const: 'url',
      },
      metadata: {
        description:
          'An arbitrary JSON object that can be used to set additional metadata on the\nnotification. When displaying a [list of\nnotifications](/components/cord-notification-list),\nyou can filter the list by metadata value.\n\nKeys are strings, and values can be strings, numbers or booleans.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      extraClassnames: {
        description:
          'An optional space separated list of classnames to add to the notification.',
        type: ['null', 'string'],
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'actorID',
      'actor_id',
      'recipientID',
      'recipient_id',
      'template',
      'url',
      'iconUrl',
      'type',
      'metadata',
      'extraClassnames',
    ],
    required: ['template', 'type', 'url'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdatePlatformOrganizationVariables: {
    type: 'object',
    properties: {
      name: {
        description:
          'Organization name. Required when creating an organization.',
        type: 'string',
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      status: {
        description:
          'Whether this organization is active or deleted.  Attempting to log into a\ndeleted organization will fail.',
        enum: ['active', 'deleted'],
        type: 'string',
      },
      members: {
        description:
          'List of partner-specific IDs of the users who are members of this organization.\nThis will replace the existing members.',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
    },
    additionalProperties: false,
    propertyOrder: ['name', 'metadata', 'status', 'members'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdatePlatformOrganizationMembersVariables: {
    type: 'object',
    properties: {
      add: {
        description: 'The IDs of users to add to this organization.',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
      remove: {
        description: 'The IDs of users to remove from this organization.',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
    },
    additionalProperties: false,
    propertyOrder: ['add', 'remove'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreatePlatformOrganizationVariables: {
    type: 'object',
    properties: {
      id: { $ref: '#/definitions/ID', description: 'ID of the organization' },
      name: {
        description:
          'Organization name. Required when creating an organization.',
        type: 'string',
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      status: {
        description:
          'Whether this organization is active or deleted.  Attempting to log into a\ndeleted organization will fail.',
        enum: ['active', 'deleted'],
        type: 'string',
      },
      members: {
        description:
          'List of partner-specific IDs of the users who are members of this organization',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
    },
    additionalProperties: false,
    propertyOrder: ['id', 'name', 'metadata', 'status', 'members'],
    required: ['id', 'name'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdatePlatformGroupVariables: {
    description: 'https://docs.cord.com/rest-apis/groups/',
    type: 'object',
    properties: {
      name: {
        description: 'Group name. Required when creating an group.',
        type: 'string',
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      status: {
        description:
          'Whether this group is active or deleted.  Attempting to log into a\ndeleted group will fail.',
        enum: ['active', 'deleted'],
        type: 'string',
      },
      members: {
        description:
          'List of partner-specific IDs of the users who are members of this group.\nThis will replace the existing members.',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
    },
    additionalProperties: false,
    propertyOrder: ['name', 'metadata', 'status', 'members'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdatePlatformGroupMembersVariables: {
    description: 'https://docs.cord.com/rest-apis/groups/',
    type: 'object',
    properties: {
      add: {
        description: 'The IDs of users to add to this group.',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
      remove: {
        description: 'The IDs of users to remove from this group.',
        type: 'array',
        items: { $ref: '#/definitions/ID' },
      },
    },
    additionalProperties: false,
    propertyOrder: ['add', 'remove'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdateUserPreferenceVariables: {
    description: 'https://docs.cord.com/rest-apis/preferences/',
    type: 'object',
    properties: {
      key: {
        description:
          'The preference key. `notification_channels` controls how users get notified about Cord activity.',
        type: 'string',
        const: 'notification_channels',
      },
      value: {
        $ref: '#/definitions/Partial<NotificationPreferences>',
        description:
          'The updated preference value. This will update only the keys that are passed along.\nFor example, to disable Slack notification, but leave email untouched, you can use this value:\n\n```json\n{\n   "value": { "sendViaSlack": "false" },\n}\n```',
      },
    },
    additionalProperties: false,
    propertyOrder: ['key', 'value'],
    required: ['key', 'value'],
    definitions: {
      'Partial<NotificationPreferences>': {
        type: 'object',
        properties: {
          sendViaSlack: {
            description: 'Whether notifications should be sent via slack.',
            type: 'boolean',
          },
          sendViaEmail: {
            description: 'Whether notifications should be sent via email.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        propertyOrder: ['sendViaSlack', 'sendViaEmail'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdateUserPresenceVariables: {
    description: 'https://docs.cord.com/rest-apis/presence/',
    type: 'object',
    properties: {
      organizationID: { type: 'string' },
      exclusiveWithin: {
        description:
          'Sets an "exclusivity region" for the ephemeral presence set by this update.\nA user can only be present at one location for a given value of exclusiveWithin.\nIf the user becomes present at a different location with the same value of\nexclusiveWithin, they automatically become no longer present at all other\nlocations with that value of exclusive_within.\nThis is useful to more easily track presence as a user moves among sub-locations.\nFor example, suppose we\'d like to track which specific paragraph on a page\na user is present. We could make those updates like this:\n\n```json\n{\n   "groupID": "<GROUP_ID>",\n   "location": { "page": "<PAGE_ID>", "paragraph": "<PARAGRAPH_ID>" },\n   "exclusiveWithin": { "page": "<PAGE_ID>" }\n}\n```\n\nAs a user moves around a page, their paragraphID will change, while their\npageID will remain the same. The above call to setPresent will mark them\npresent at their specific paragraph. However, since every update uses the\nsame exclusiveWithin, each time they are marked present at one paragraph\nthey will become no longer present at their previous paragraph.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      location: {
        description:
          'The [location](/reference/location) you want the user to be in.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      groupID: {
        description:
          'The ID of the group which should be able to see this presence update',
        type: 'string',
      },
      durable: {
        description:
          'When `true`, this is a [durable presence](/js-apis-and-hooks/presence-api)\nupdate, when `false`, or is not used, it is an [ephemeral presence](/js-apis-and-hooks/presence-api) update.\n\nThis value defaults to `false.`',
        type: 'boolean',
      },
      absent: {
        description:
          'When `true`, this is an *absence* update, meaning that the user has just left\nthis [location](/reference/location).\nIf the user is currently present at that location, it is cleared.\nThis cannot be used with a [durable presence](/js-apis-and-hooks/presence-api) update.\n\nThis value defaults to `false.` The user will be set as present at the location.',
        type: 'boolean',
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'organizationID',
      'exclusiveWithin',
      'location',
      'groupID',
      'durable',
      'absent',
    ],
    required: ['location'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreateProjectVariables: {
    description: 'https://docs.cord.com/rest-apis/projects/',
    type: 'object',
    properties: {
      emailSettings: { $ref: '#/definitions/Partial<EmailSettings>' },
      name: {
        description: 'Name of the project',
        minLength: 1,
        type: 'string',
      },
      iconURL: {
        description:
          'URL for the project icon. It should be a square image of 256x256. This\nwill be used as the avatar for messages and emails coming from your\nproject.  If not specified, the Cord logo will be used.',
        format: 'uri',
        type: ['null', 'string'],
      },
      eventWebhookURL: {
        description: 'The URL that the events webhook is sent to',
        format: 'uri',
        type: ['null', 'string'],
      },
      redirectURI: {
        description:
          'Custom url link contained in email and slack notifications. These notifications are sent when a user is\nmentioned or thread is shared and by default, the link points to the page where the conversation happened.\nFor more information, please refer to the [API docs](/customization/redirect-link)',
        type: ['null', 'string'],
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'emailSettings',
      'name',
      'iconURL',
      'eventWebhookURL',
      'redirectURI',
    ],
    required: ['name'],
    definitions: {
      'Partial<EmailSettings>': {
        type: 'object',
        properties: {
          name: {
            description:
              "Name to show in both the subject and the body of the email.\nDefaults to your project's name.",
            type: ['null', 'string'],
          },
          imageURL: {
            description:
              'URL for your logo image. The default for this is the Cord logo.',
            type: ['null', 'string'],
          },
          sender: {
            description:
              'Email from which notifications for your service will be sent from.\nThis will use the provided name for your project to default to `<projectname>-notifications@cord.fyi`.',
            format: 'email',
            type: ['null', 'string'],
          },
          logoConfig: {
            description:
              'Customization for your logo size. Providing either a height (maximum 120) or\nwidth (maximum 240) will result in the image being proportionally resized to\nfit in a container of that size. The default value is `{"width": 140}`.',
            anyOf: [
              {
                type: 'object',
                properties: {
                  width: { minimum: 0, maximum: 240, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['width'],
                required: ['width'],
              },
              {
                type: 'object',
                properties: {
                  height: { minimum: 0, maximum: 120, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['height'],
                required: ['height'],
              },
              { type: 'null' },
            ],
          },
          enableEmailNotifications: {
            description:
              'Whether you want your users to receive notification emails. The default value is true.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'name',
          'imageURL',
          'sender',
          'logoConfig',
          'enableEmailNotifications',
        ],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdateProjectVariables: {
    description: 'https://docs.cord.com/rest-apis/projects/',
    type: 'object',
    properties: {
      emailSettings: { $ref: '#/definitions/Partial<EmailSettings>' },
      name: {
        description: 'Name of the project',
        minLength: 1,
        type: 'string',
      },
      iconURL: {
        description:
          'URL for the project icon. It should be a square image of 256x256. This\nwill be used as the avatar for messages and emails coming from your\nproject.  If not specified, the Cord logo will be used.',
        format: 'uri',
        type: ['null', 'string'],
      },
      eventWebhookURL: {
        description: 'The URL that the events webhook is sent to',
        format: 'uri',
        type: ['null', 'string'],
      },
      redirectURI: {
        description:
          'Custom url link contained in email and slack notifications. These notifications are sent when a user is\nmentioned or thread is shared and by default, the link points to the page where the conversation happened.\nFor more information, please refer to the [API docs](/customization/redirect-link)',
        type: ['null', 'string'],
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'emailSettings',
      'name',
      'iconURL',
      'eventWebhookURL',
      'redirectURI',
    ],
    definitions: {
      'Partial<EmailSettings>': {
        type: 'object',
        properties: {
          name: {
            description:
              "Name to show in both the subject and the body of the email.\nDefaults to your project's name.",
            type: ['null', 'string'],
          },
          imageURL: {
            description:
              'URL for your logo image. The default for this is the Cord logo.',
            type: ['null', 'string'],
          },
          sender: {
            description:
              'Email from which notifications for your service will be sent from.\nThis will use the provided name for your project to default to `<projectname>-notifications@cord.fyi`.',
            format: 'email',
            type: ['null', 'string'],
          },
          logoConfig: {
            description:
              'Customization for your logo size. Providing either a height (maximum 120) or\nwidth (maximum 240) will result in the image being proportionally resized to\nfit in a container of that size. The default value is `{"width": 140}`.',
            anyOf: [
              {
                type: 'object',
                properties: {
                  width: { minimum: 0, maximum: 240, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['width'],
                required: ['width'],
              },
              {
                type: 'object',
                properties: {
                  height: { minimum: 0, maximum: 120, type: 'number' },
                },
                additionalProperties: false,
                propertyOrder: ['height'],
                required: ['height'],
              },
              { type: 'null' },
            ],
          },
          enableEmailNotifications: {
            description:
              'Whether you want your users to receive notification emails. The default value is true.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'name',
          'imageURL',
          'sender',
          'logoConfig',
          'enableEmailNotifications',
        ],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  DeleteProjectVariables: {
    description: 'https://docs.cord.com/rest-apis/projects/',
    type: 'object',
    properties: {
      secret: {
        description:
          'Secret key of the project that you want to delete. This can be found\nwithin the Cord Console.',
        minLength: 1,
        type: 'string',
      },
    },
    additionalProperties: false,
    propertyOrder: ['secret'],
    required: ['secret'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreateThreadVariables: {
    description: 'https://docs.cord.com/rest-apis/threads/',
    type: 'object',
    properties: {
      location: {
        description: 'The [location](/reference/location) of this thread.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      id: { description: 'The ID for this thread.', type: 'string' },
      url: {
        description:
          "A URL where the thread can be seen.  This determines where a user is sent\nwhen they click on a reference to this thread, such as in a notification,\nor if they click on a reference to a message in the thread and the message\ndoesn't have its own URL.",
        type: 'string',
      },
      name: {
        description:
          'The name of the thread.  This is shown to users when the thread is\nreferenced, such as in notifications.  This should generally be something\nlike the page title.',
        type: 'string',
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      groupID: {
        description: 'The group ID this thread is in.',
        type: 'string',
      },
      extraClassnames: {
        description:
          'An optional space separated list of classnames to add to the thread.',
        type: ['null', 'string'],
      },
      addSubscribers: {
        description: 'A list of subscribers to add to this thread.',
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'location',
      'id',
      'url',
      'name',
      'metadata',
      'groupID',
      'extraClassnames',
      'addSubscribers',
    ],
    required: ['groupID', 'location', 'name', 'url'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdateThreadVariables: {
    description: 'https://docs.cord.com/rest-apis/threads/',
    type: 'object',
    properties: {
      location: {
        description: 'The [location](/reference/location) of this thread.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      id: { description: 'The ID for this thread.', type: 'string' },
      url: {
        description:
          "A URL where the thread can be seen.  This determines where a user is sent\nwhen they click on a reference to this thread, such as in a notification,\nor if they click on a reference to a message in the thread and the message\ndoesn't have its own URL.",
        type: 'string',
      },
      name: {
        description:
          'The name of the thread.  This is shown to users when the thread is\nreferenced, such as in notifications.  This should generally be something\nlike the page title.',
        type: 'string',
      },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      organizationID: {
        description: 'The organization ID this thread is in.',
        type: 'string',
      },
      groupID: {
        description: 'The group ID this thread is in.',
        type: 'string',
      },
      extraClassnames: {
        description:
          'An optional space separated list of classnames to add to the thread.',
        type: ['null', 'string'],
      },
      resolvedTimestamp: {
        description:
          'The timestamp when this thread was resolved. Set to `null` if this thread\nis not resolved.',
        anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
      },
      userID: {
        description:
          'Certain changes to the thread may post a message into the thread -- in\nparticular, resolving or unresolving a thread posts a message into the\nthread saying "User un/resolved this thread". This parameter is the ID of\nthe User who will be listed as the author of that message. It\'s optional\n-- if no user is specified, then those messages won\'t get posted.',
        type: 'string',
      },
      typing: {
        description:
          "Marks the specified users as typing in this thread.  The typing indicator\nexpires after 3 seconds, so to continually show the indicator it needs to\nbe called on an interval.  Pass an empty array to clear all users' typing indicators.",
        type: 'array',
        items: { type: 'string' },
      },
      resolved: {
        description:
          'Whether the thread is resolved.  Setting this to `true` is equivalent to\nsetting `resolvedTimestamp` to the current time, and setting this to\n`false` is equivalent to setting `resolvedTimestamp` to `null`.',
        type: 'boolean',
      },
      seenByUsers: {
        description:
          'Marks the specified users as having seen/not seen this thread. If a user\nis not included in this list, the seen status will not be changed.',
        type: 'array',
        items: { $ref: '#/definitions/ServerThreadSeenUser' },
      },
      addSubscribers: {
        description: 'A list of subscribers to add to this thread.',
        type: 'array',
        items: { type: 'string' },
      },
      removeSubscribers: {
        description: 'A list of subscribers to remove from this thread.',
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'location',
      'id',
      'url',
      'name',
      'metadata',
      'organizationID',
      'groupID',
      'extraClassnames',
      'resolvedTimestamp',
      'userID',
      'typing',
      'resolved',
      'seenByUsers',
      'addSubscribers',
      'removeSubscribers',
    ],
    definitions: {
      ServerThreadSeenUser: {
        description: 'https://docs.cord.com/rest-apis/threads/',
        type: 'object',
        properties: {
          userID: {
            description: 'ID of the user that has seen/not seen the thread.',
            type: 'string',
          },
          seen: {
            description: 'Whether the user has seen the thread or not.',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        propertyOrder: ['userID', 'seen'],
        required: ['seen', 'userID'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListThreadQueryParameters: {
    description: 'https://docs.cord.com/rest-apis/threads/',
    type: 'object',
    properties: {
      filter: {
        description:
          'Threads will be matched against the filters specified.\nThis is a partial match, which means any keys other than the ones you specify are ignored\nwhen checking for a match. Please note that because this is a query parameter in a REST API,\nthis JSON object must be URI encoded before being sent.',
        $ref: '#/definitions/ServerListThreadFilter',
      },
      limit: {
        description: 'Number of threads to return. Defaults to 1000.',
        type: 'number',
      },
      token: {
        description:
          'Pagination token. This is returned in the `pagination` object of a previous response.',
        type: 'string',
      },
    },
    additionalProperties: false,
    propertyOrder: ['filter', 'limit', 'token'],
    definitions: {
      ServerListThreadFilter: {
        type: 'object',
        properties: {
          location: {
            description:
              'The [Location](/reference/location) of the threads.\nThis can either be just the location value or an object with a value for\nboth the location and partialMatch properties.\n\nThe value for partialMatch will default to false if only location is provided.',
            anyOf: [
              {
                type: 'object',
                additionalProperties: { type: ['string', 'number', 'boolean'] },
                propertyOrder: [],
              },
              {
                type: 'object',
                properties: {
                  value: {
                    description:
                      'The [Location](/reference/location) of the threads.',
                    type: 'object',
                    additionalProperties: {
                      type: ['string', 'number', 'boolean'],
                    },
                    propertyOrder: [],
                  },
                  partialMatch: {
                    description:
                      'If `true`, perform [partial matching](/reference/location#Partial-Matching)\non the specified location. If `false`, fetch information for only exactly the\nlocation specified.',
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
                propertyOrder: ['value', 'partialMatch'],
                required: ['partialMatch', 'value'],
              },
            ],
          },
          metadata: {
            description:
              'Return only objects containing these metadata keys and values. (Metadata is\narbitrary key-value pairs of data that you can associate with an object.)',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          groupID: {
            description:
              'Return only threads [belonging to this\ngroup](/reference/permissions).',
            type: 'string',
          },
          firstMessageTimestamp: {
            description:
              'Return only threads with a "first message timestamp" within this range. The\n"first message timestamp" of a thread is the timestamp when the first\nmessage in the thread was created. (This is typically when the thread was\ncreated.)',
            type: 'object',
            properties: {
              from: {
                description:
                  "Timestamp from where to start the interval. The thread's timestamp must be\n*newer* than (or equal to) this in order to match the filter.\n\nIf not present, the interval will have no start date and any data will\ninclude everything older than the provided `to` timestamp.",
                type: 'string',
                format: 'date-time',
              },
              to: {
                description:
                  "Timestamp where to end the interval. The thread's timestamp must be *older*\nthan (or equal to) this in order to match the filter.\n\nIf not present, the interval will have no end date and any data will\ninclude everything newer than the provided `from` timestamp.",
                type: 'string',
                format: 'date-time',
              },
            },
            additionalProperties: false,
            propertyOrder: ['from', 'to'],
          },
          mostRecentMessageTimestamp: {
            description:
              'Return only threads with a "most recent message timestamp" within this\nrange. The "most recent message timestamp" of a thread is the timestamp\nwhen the most recent message in the thread was created or updated. (This is\ntypically when the thread was most recently replied to.)',
            type: 'object',
            properties: {
              from: {
                description:
                  "Timestamp from where to start the interval. The thread's timestamp must be\n*newer* than (or equal to) this in order to match the filter.\n\nIf not present, the interval will have no start date and any data will\ninclude everything older than the provided `to` timestamp.",
                type: 'string',
                format: 'date-time',
              },
              to: {
                description:
                  "Timestamp where to end the interval. The thread's timestamp must be *older*\nthan (or equal to) this in order to match the filter.\n\nIf not present, the interval will have no end date and any data will\ninclude everything newer than the provided `from` timestamp.",
                type: 'string',
                format: 'date-time',
              },
            },
            additionalProperties: false,
            propertyOrder: ['from', 'to'],
          },
          resolvedStatus: {
            description:
              'If set to `resolved`, only resolved threads will be returned. If set to `unresolved`,\nonly unresolved threads will be returned. If set to `any`, both resolved and\nunresolved threads will be returned.\n\nIf unset, defaults to `any`.',
            enum: ['any', 'resolved', 'unresolved'],
            type: 'string',
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'location',
          'metadata',
          'groupID',
          'firstMessageTimestamp',
          'mostRecentMessageTimestamp',
          'resolvedStatus',
        ],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  UpdatePlatformUserVariables: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'object',
    properties: {
      name: { description: 'Full user name', type: ['null', 'string'] },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      status: { enum: ['active', 'deleted'], type: 'string' },
      email: {
        description: 'Email address',
        format: 'email',
        type: ['null', 'string'],
      },
      shortName: {
        description:
          'Short user name. In most cases, this will be preferred over name when set.',
        type: ['null', 'string'],
      },
      short_name: { type: ['null', 'string'] },
      profilePictureURL: {
        description:
          "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
        format: 'uri',
        type: ['null', 'string'],
      },
      profile_picture_url: {
        description: 'Alias for profilePictureURL. This field is deprecated.',
        format: 'uri',
        type: ['null', 'string'],
      },
      first_name: {
        description:
          "User's first name. This field is deprecated and has no effect.",
        type: ['null', 'string'],
      },
      last_name: {
        description:
          "User's last name. This field is deprecated and has no effect.",
        type: ['null', 'string'],
      },
      addGroups: {
        description:
          "A list of group IDs this user should be made a member of.  It is an error\nto specify a group that doesn't exist or one that is also being removed in\nthe same call.  It is not an error to add a user to a group they're already\na member of.",
        type: 'array',
        items: { type: 'string' },
      },
      removeGroups: {
        description:
          "A list of group IDs this user should stop being a member of.  It is an\nerror to specify a group that doesn't exist or one that is also being added\nin the same call.  It is not an error to remove a user from a group they\nare not a member of.",
        type: 'array',
        items: { type: 'string' },
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'name',
      'metadata',
      'status',
      'email',
      'shortName',
      'short_name',
      'profilePictureURL',
      'profile_picture_url',
      'first_name',
      'last_name',
      'addGroups',
      'removeGroups',
    ],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreatePlatformUserVariables: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'object',
    properties: {
      name: { description: 'Full user name', type: ['null', 'string'] },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      status: { enum: ['active', 'deleted'], type: 'string' },
      email: {
        description: 'Email address',
        format: 'email',
        type: ['null', 'string'],
      },
      shortName: {
        description:
          'Short user name. In most cases, this will be preferred over name when set.',
        type: ['null', 'string'],
      },
      short_name: { type: ['null', 'string'] },
      profilePictureURL: {
        description:
          "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
        format: 'uri',
        type: ['null', 'string'],
      },
      profile_picture_url: {
        description: 'Alias for profilePictureURL. This field is deprecated.',
        format: 'uri',
        type: ['null', 'string'],
      },
      first_name: {
        description:
          "User's first name. This field is deprecated and has no effect.",
        type: ['null', 'string'],
      },
      last_name: {
        description:
          "User's last name. This field is deprecated and has no effect.",
        type: ['null', 'string'],
      },
      id: { $ref: '#/definitions/ID', description: 'Provided ID for the user' },
    },
    additionalProperties: false,
    propertyOrder: [
      'name',
      'metadata',
      'status',
      'email',
      'shortName',
      'short_name',
      'profilePictureURL',
      'profile_picture_url',
      'first_name',
      'last_name',
      'id',
    ],
    required: ['id'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListPlatformUserVariables: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'object',
    properties: {
      email: { type: ['null', 'string'] },
      id: { $ref: '#/definitions/ID', description: 'Provided ID for the user' },
      name: { description: 'Full user name', type: ['null', 'string'] },
      metadata: {
        description:
          'Arbitrary key-value pairs that can be used to store additional information.',
        type: 'object',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
        propertyOrder: [],
      },
      status: { enum: ['active', 'deleted'], type: 'string' },
      createdTimestamp: {
        description: 'Creation timestamp',
        anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
      },
      shortName: {
        description:
          'Short user name. In most cases, this will be preferred over name when set.',
        type: ['null', 'string'],
      },
      short_name: { type: ['null', 'string'] },
      profilePictureURL: {
        description:
          "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
        format: 'uri',
        type: ['null', 'string'],
      },
      profile_picture_url: {
        description: 'Alias for profilePictureURL. This field is deprecated.',
        format: 'uri',
        type: ['null', 'string'],
      },
      first_name: {
        description:
          "User's first name. This field is deprecated and has no effect.",
        type: ['null', 'string'],
      },
      last_name: {
        description:
          "User's last name. This field is deprecated and has no effect.",
        type: ['null', 'string'],
      },
    },
    additionalProperties: false,
    propertyOrder: [
      'email',
      'id',
      'name',
      'metadata',
      'status',
      'createdTimestamp',
      'shortName',
      'short_name',
      'profilePictureURL',
      'profile_picture_url',
      'first_name',
      'last_name',
    ],
    required: [
      'createdTimestamp',
      'email',
      'first_name',
      'id',
      'last_name',
      'metadata',
      'name',
      'profilePictureURL',
      'profile_picture_url',
      'shortName',
      'short_name',
      'status',
    ],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListUsersResponseWithoutPagination: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'array',
    items: { $ref: '#/definitions/ServerListUser' },
    definitions: {
      ServerListUser: {
        description: 'https://docs.cord.com/rest-apis/users/',
        type: 'object',
        properties: {
          email: { type: ['null', 'string'] },
          id: {
            $ref: '#/definitions/ID',
            description: 'Provided ID for the user',
          },
          name: { description: 'Full user name', type: ['null', 'string'] },
          metadata: {
            description:
              'Arbitrary key-value pairs that can be used to store additional information.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          status: { enum: ['active', 'deleted'], type: 'string' },
          createdTimestamp: {
            description: 'Creation timestamp',
            anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
          },
          shortName: {
            description:
              'Short user name. In most cases, this will be preferred over name when set.',
            type: ['null', 'string'],
          },
          short_name: { type: ['null', 'string'] },
          profilePictureURL: {
            description:
              "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
            format: 'uri',
            type: ['null', 'string'],
          },
          profile_picture_url: {
            description:
              'Alias for profilePictureURL. This field is deprecated.',
            format: 'uri',
            type: ['null', 'string'],
          },
          first_name: {
            description:
              "User's first name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
          last_name: {
            description:
              "User's last name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'email',
          'id',
          'name',
          'metadata',
          'status',
          'createdTimestamp',
          'shortName',
          'short_name',
          'profilePictureURL',
          'profile_picture_url',
          'first_name',
          'last_name',
        ],
        required: [
          'createdTimestamp',
          'email',
          'first_name',
          'id',
          'last_name',
          'metadata',
          'name',
          'profilePictureURL',
          'profile_picture_url',
          'shortName',
          'short_name',
          'status',
        ],
      },
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListUsersResponse: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'object',
    properties: {
      users: { type: 'array', items: { $ref: '#/definitions/ServerListUser' } },
      pagination: { $ref: '#/definitions/PaginationDetails' },
    },
    additionalProperties: false,
    propertyOrder: ['users', 'pagination'],
    required: ['pagination', 'users'],
    definitions: {
      ServerListUser: {
        description: 'https://docs.cord.com/rest-apis/users/',
        type: 'object',
        properties: {
          email: { type: ['null', 'string'] },
          id: {
            $ref: '#/definitions/ID',
            description: 'Provided ID for the user',
          },
          name: { description: 'Full user name', type: ['null', 'string'] },
          metadata: {
            description:
              'Arbitrary key-value pairs that can be used to store additional information.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          status: { enum: ['active', 'deleted'], type: 'string' },
          createdTimestamp: {
            description: 'Creation timestamp',
            anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
          },
          shortName: {
            description:
              'Short user name. In most cases, this will be preferred over name when set.',
            type: ['null', 'string'],
          },
          short_name: { type: ['null', 'string'] },
          profilePictureURL: {
            description:
              "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
            format: 'uri',
            type: ['null', 'string'],
          },
          profile_picture_url: {
            description:
              'Alias for profilePictureURL. This field is deprecated.',
            format: 'uri',
            type: ['null', 'string'],
          },
          first_name: {
            description:
              "User's first name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
          last_name: {
            description:
              "User's last name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
        },
        additionalProperties: false,
        propertyOrder: [
          'email',
          'id',
          'name',
          'metadata',
          'status',
          'createdTimestamp',
          'shortName',
          'short_name',
          'profilePictureURL',
          'profile_picture_url',
          'first_name',
          'last_name',
        ],
        required: [
          'createdTimestamp',
          'email',
          'first_name',
          'id',
          'last_name',
          'metadata',
          'name',
          'profilePictureURL',
          'profile_picture_url',
          'shortName',
          'short_name',
          'status',
        ],
      },
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
      PaginationDetails: {
        type: 'object',
        properties: {
          token: {
            description:
              'The token to use to get the next page of results. If empty, there are no more results.',
            type: ['null', 'string'],
          },
          total: {
            description:
              'Total number of results. Might be bigger than the number of results returned on the query. Useful to display a "total" counter.',
            type: 'number',
          },
        },
        additionalProperties: false,
        propertyOrder: ['token', 'total'],
        required: ['token', 'total'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ListUserQueryParameters: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'object',
    properties: {
      limit: {
        description:
          'Number of users to return.\nThe default limit is set to 1000.',
        type: 'number',
      },
      token: {
        description:
          'Pagination token. This is returned in the `pagination` object of a previous response.',
        type: 'string',
      },
      filter: {
        description:
          'This is a JSON object with one optional entry.  Users will be matched\nagainst the filter specified. This is a partial match, which means any keys\nother than the ones you specify are ignored when checking for a match.\nPlease note that because this is a query parameter in a REST API, this JSON\nobject must be URI encoded before being sent.',
        $ref: '#/definitions/Pick<FilterParameters,"metadata">',
      },
    },
    additionalProperties: false,
    propertyOrder: ['limit', 'token', 'filter'],
    definitions: {
      'Pick<FilterParameters,"metadata">': {
        type: 'object',
        properties: {
          metadata: {
            description:
              'Return only objects containing these metadata keys and values. (Metadata is\narbitrary key-value pairs of data that you can associate with an object.)',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
        },
        additionalProperties: false,
        propertyOrder: ['metadata'],
      },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  DeleteUserVariables: {
    description: 'https://docs.cord.com/rest-apis/users/',
    type: 'object',
    properties: {
      permanently_delete: {
        description: 'The user will be deleted only if this value is true.',
        type: 'boolean',
      },
    },
    additionalProperties: false,
    propertyOrder: ['permanently_delete'],
    required: ['permanently_delete'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  CreateWebhookVariables: {
    type: 'object',
    properties: {
      url: {
        description: 'The URL to register that will receive webhook events',
        format: 'uri',
        type: 'string',
      },
      events: {
        description: 'The events which you will receive',
        type: 'array',
        items: {
          enum: [
            'notification-created',
            'thread-message-added',
            'url-verification',
          ],
          type: 'string',
        },
      },
    },
    additionalProperties: false,
    propertyOrder: ['url', 'events'],
    required: ['events', 'url'],
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
  ClientAuthTokenData: {
    description: 'https://docs.cord.com/reference/authentication/',
    additionalProperties: true,
    type: 'object',
    properties: {
      app_id: { format: 'uuid', type: 'string' },
      project_id: {
        description: 'Your project ID',
        format: 'uuid',
        type: 'string',
      },
      user_id: { $ref: '#/definitions/ID', description: 'The ID for the user' },
      organization_id: {
        minLength: 1,
        maxLength: 128,
        type: ['string', 'number'],
      },
      group_id: {
        minLength: 1,
        maxLength: 128,
        description: 'The ID for the user’s group',
        type: ['string', 'number'],
      },
      user_details: {
        description:
          'If present, update’s the user’s details, or creates a user with those\ndetails if the user_id is new to Cord. This is an object that contains the\nsame fields as the [user management REST\nendpoint](/rest-apis/users/)',
        $ref: '#/definitions/ServerUpdateUser',
      },
      organization_details: {
        $ref: '#/definitions/Partial<Omit<ServerOrganizationData,"id"|"members"|"connectedToSlack">&{members?:ID[]|undefined;}>',
      },
      group_details: {
        description:
          "If present, updates the group's details, or creates a group\nwith those details if the group_id is new to Cord. This is an object\nthat contains the same fields as the [group management REST\nendpoint](/rest-apis/groups/)",
        $ref: '#/definitions/Partial<Omit<ServerGroupData,"id"|"members"|"connectedToSlack">&{members?:ID[]|undefined;}>',
      },
    },
    propertyOrder: [
      'app_id',
      'project_id',
      'user_id',
      'organization_id',
      'group_id',
      'user_details',
      'organization_details',
      'group_details',
    ],
    required: ['user_id'],
    definitions: {
      ID: { minLength: 1, maxLength: 128, type: ['string', 'number'] },
      ServerUpdateUser: {
        description: 'https://docs.cord.com/rest-apis/users/',
        additionalProperties: false,
        type: 'object',
        properties: {
          name: { description: 'Full user name', type: ['null', 'string'] },
          metadata: {
            description:
              'Arbitrary key-value pairs that can be used to store additional information.',
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            propertyOrder: [],
          },
          status: { enum: ['active', 'deleted'], type: 'string' },
          email: {
            description: 'Email address',
            format: 'email',
            type: ['null', 'string'],
          },
          shortName: {
            description:
              'Short user name. In most cases, this will be preferred over name when set.',
            type: ['null', 'string'],
          },
          short_name: { type: ['null', 'string'] },
          profilePictureURL: {
            description:
              "This must be a valid URL, which means it needs to follow the usual URL\nformatting and encoding rules. For example, any space character will need\nto be encoded as `%20`. We recommend using your programming language's\nstandard URL encoding function, such as `encodeURI` in Javascript.",
            format: 'uri',
            type: ['null', 'string'],
          },
          profile_picture_url: {
            description:
              'Alias for profilePictureURL. This field is deprecated.',
            format: 'uri',
            type: ['null', 'string'],
          },
          first_name: {
            description:
              "User's first name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
          last_name: {
            description:
              "User's last name. This field is deprecated and has no effect.",
            type: ['null', 'string'],
          },
          addGroups: {
            description:
              "A list of group IDs this user should be made a member of.  It is an error\nto specify a group that doesn't exist or one that is also being removed in\nthe same call.  It is not an error to add a user to a group they're already\na member of.",
            type: 'array',
            items: { type: 'string' },
          },
          removeGroups: {
            description:
              "A list of group IDs this user should stop being a member of.  It is an\nerror to specify a group that doesn't exist or one that is also being added\nin the same call.  It is not an error to remove a user from a group they\nare not a member of.",
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      'Partial<Omit<ServerOrganizationData,"id"|"members"|"connectedToSlack">&{members?:ID[]|undefined;}>':
        {
          type: 'object',
          properties: {
            name: {
              description:
                'Organization name. Required when creating an organization.',
              type: 'string',
            },
            metadata: {
              description:
                'Arbitrary key-value pairs that can be used to store additional information.',
              type: 'object',
              additionalProperties: { type: ['string', 'number', 'boolean'] },
              propertyOrder: [],
            },
            status: {
              description:
                'Whether this organization is active or deleted.  Attempting to log into a\ndeleted organization will fail.',
              enum: ['active', 'deleted'],
              type: 'string',
            },
            members: {
              description:
                'List of partner-specific IDs of the users who are members of this organization.\nThis will replace the existing members.',
              type: 'array',
              items: { $ref: '#/definitions/ID' },
            },
          },
          additionalProperties: false,
          propertyOrder: ['name', 'metadata', 'status', 'members'],
        },
      'Partial<Omit<ServerGroupData,"id"|"members"|"connectedToSlack">&{members?:ID[]|undefined;}>':
        {
          type: 'object',
          properties: {
            name: {
              description: 'Group name. Required when creating an group.',
              type: 'string',
            },
            metadata: {
              description:
                'Arbitrary key-value pairs that can be used to store additional information.',
              type: 'object',
              additionalProperties: { type: ['string', 'number', 'boolean'] },
              propertyOrder: [],
            },
            status: {
              description:
                'Whether this group is active or deleted.  Attempting to log into a\ndeleted group will fail.',
              enum: ['active', 'deleted'],
              type: 'string',
            },
            members: {
              description:
                'List of partner-specific IDs of the users who are members of this group.\nThis will replace the existing members.',
              type: 'array',
              items: { $ref: '#/definitions/ID' },
            },
          },
          additionalProperties: false,
          propertyOrder: ['name', 'metadata', 'status', 'members'],
        },
    },
    $schema: 'http://json-schema.org/draft-07/schema#',
  },
} as const;
