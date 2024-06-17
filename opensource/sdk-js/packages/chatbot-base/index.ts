import { fetchCordRESTApi, validateWebhookSignature } from '@cord-sdk/server';
import type {
  CoreMessageData,
  CoreThreadData,
  ServerUpdateUser,
  WebhookWrapperProperties,
} from '@cord-sdk/types';
import { isAsyncIterable, stringToMessageContent } from './private/util.js';

type MessageCreatedWebhookEvent =
  WebhookWrapperProperties<'thread-message-added'>;

export interface ChatbotRegistry {
  /**
   * Registers a new bot. You'll typically call this only once per bot, at
   * server startup.
   *
   * @param botID A unique identifier for the bot. This uniquely identifies your
   * bot, so you should use the same one at each server startup.  It will also
   * be used as the [identifier](https://docs.cord.com/reference/identifiers)
   * for the bot's Cord user.
   *
   * @param bot The new `Chatbot` object to register.
   *
   * @returns A promise which you should await to ensure the bot has been set up
   * correctly. Rejects if there is an issue talking to the Cord REST API when
   * setting up the bot, resolves with no value otherwise.
   */
  register(botID: string, bot: Chatbot): Promise<void>;

  /**
   * Function which you should call in the HTTP POST handler which receives
   * [Cord webhooks](https://docs.cord.com/reference/events-webhook). See the
   * [getting started
   * guide](https://docs.cord.com/chatbot-ai-sdk/getting-started) for more
   * information on how to set this up.
   *
   * @param req The original `Request` object received by the webhook HTTP POST
   * handler.
   *
   * @returns A promise, which will resolve to a boolean. If that boolean is
   * `true`, that means that this function has fully handled the webhook and you
   * should respond to the HTTP request with success. If that boolean is
   * `false`, then this function didn't handle the webhook; you can either
   * handle the webhook yourself (e.g., if you have other uses for Cord webhooks
   * beyond chatbots) or otherwise return an HTTP failure code.
   */
  webhookReceived(req: Request): Promise<boolean>;

  /**
   * You can call this function to force the bot to respond on a thread, even if
   * there is no incoming message on the thread. This will completely bypass
   * `shouldRespondToEvent` and move directly to `getResponse`. This is useful
   * if you want a bot to start a conversation unprompted, for example.
   *
   * @param botID ID of the bot (as passed to `register`) you want to respond.
   *
   * @param threadID ID of the thread you want the bot to respond on.
   */
  forceRespond(botID: string, threadID: string): Promise<void>;
}

export interface Chatbot {
  /**
   * A description of the representation of this bot in the Cord UI, i.e., the
   * bot's name, profile picture, etc. The structure of this data is identical
   * to that accepted by the [create/update user REST
   * API](https://docs.cord.com/rest-apis/users#Create-or-update-a-user).
   */
  cordUser: ServerUpdateUser;

  /**
   * Called whenever any message is added to any thread anywhere in the Cord
   * application (including messages from the bot itself). Determines whether or
   * not this bot wants to respond to that message. This lets you filter down to
   * only respond on certain threads, only respond to certain people, etc.
   * You'll almost certainly want to start this function with
   * `if (eventIsFromBot(event)) return false`
   * so that the bot does not get stuck in a loop responding to itself.
   *
   * @param event A [`thread-message-added` webhook
   * event](https://docs.cord.com/reference/events-webhook/events/thread-message-added).
   *
   * @returns Whether or not this bot wants to respond to this event. If `true`,
   * `getResponse` will later be called to actually compute the response. If
   * `false`, then `getResponse` will be entirely skipped.
   */
  shouldRespondToEvent(
    event: MessageCreatedWebhookEvent,
  ): boolean | Promise<boolean>;

  /**
   * Called in order to have the chatbot AI logic generate a new message to add
   * to the end of a thread.
   *
   * @param messages List of messages in the thread, sorted oldest message
   * first. The message structure is the same as returned by the [message REST
   * API](https://docs.cord.com/rest-apis/messages).
   *
   * @param thread Data about the thread. The thread structure is the same as
   * returned by the [thread REST API](https://docs.cord.com/rest-apis/threads).
   *
   * @returns Contents of a new message to add to the end of the thread. This
   * can be returned directly as a `string`, or as a `Promise` which resolves to
   * a string. You can also return an `AsyncIterator` which yields the message
   * incrementally; the message will be streamed to Cord and appear on users'
   * screens bit-by-bit as the iterator yields it (with the final message being
   * the concatenation of all of the strings yielded). Can also return `null` or
   * `undefined` to signal that no new message should be added (but it is better
   * for performance to return `false` from `shouldRespondToEvent` instead).
   */
  getResponse(
    messages: CoreMessageData[],
    thread: CoreThreadData,
  ):
    | string
    | null
    | undefined
    // TODO: support MessageContent.
    | Promise<string | null | undefined>
    | AsyncIterable<string | null | undefined>;

  /**
   * Optional callback, called after `getResponse` has finished sending a new
   * message to Cord, with the contents of that message. This can occasionally
   * be useful when you need to do something with the completed Cord message,
   * such as setting `metadata` on the message. You might also use this callback
   * in a complex game in order to call `forceRespond` to cause a *different* AI
   * to continue the conversation!
   *
   * @param response The new message added by `getResponse`. The message
   * structure is the same as returned by the [message REST
   * API](https://docs.cord.com/rest-apis/messages).
   *
   * @param messages List of messages in the thread, sorted oldest message
   * first. This is *exactly* the same list of messages which was sent to
   * `getResponse`, so it will *not* include the `response` message. The message
   * structure is the same as returned by the [message REST
   * API](https://docs.cord.com/rest-apis/messages).
   *
   * @param thread Data about the thread. The thread structure is the same as
   * returned by the [thread REST API](https://docs.cord.com/rest-apis/threads).
   *
   * @returns The return value is ignored.
   */
  onResponseSent?(
    response: CoreMessageData,
    messages: CoreMessageData[],
    thread: CoreThreadData,
  ): void | Promise<void>;
}

const BOT_METADATA_KEY = '__chatBot';

/**
 * Determines if an event was generated by a bot sending a message (as opposed
 * to a human doing so). This is particularly useful for `shouldRespondToEvent`
 * to make sure that a bot does not respond to itself.
 *
 * This function works by checking for a special metadata field set on bots
 * registered via this SDK. If you use the Cord APIs to change the metadata on
 * your bot, then this function will no longer detect events coming from it as
 * being from a bot.
 *
 * @param event A [`thread-message-added` webhook
 * event](https://docs.cord.com/reference/events-webhook/events/thread-message-added).
 *
 * @returns `true` if that event is about the creation of a message by a bot,
 * `false` otherwise.
 */
export function eventIsFromBot(event: MessageCreatedWebhookEvent): boolean {
  return !!event.event.author.metadata[BOT_METADATA_KEY];
}

/**
 * Determines if a message was sent by a bot (as opposed to a human). This can
 * be useful when sending Cord messages to an LLM completion API, which needs to
 * know which messages came from the LLM and which came from a human.
 *
 * This function works by checking for a special metadata field set on messages
 * sent via this SDK. If you directly use the Cord APIs to have your bot send a
 * message, or use the Cord APIs to change the metadata of any messages sent via
 * this SDK, then this function will not detect them as being from a bot.
 *
 * @param message This message structure is the same as returned by the [message
 * REST API](https://docs.cord.com/rest-apis/messages).
 *
 * @returns `true` if that message was sent by a bot, `false` otherwise.
 */
export function messageIsFromBot(message: CoreMessageData): boolean {
  return !!message.metadata[BOT_METADATA_KEY];
}

/**
 * Creates a new bot registry -- the main entrypoint into the Chatbot SDK. This
 * function will typically be called exactly once, during server startup.
 *
 * @param project_id Project ID, from the [Cord console](https://console.cord.com/)
 * @param project_secret Project secret, from the [Cord console](https://console.cord.com/)
 * @returns A new bot registry
 */
export function chatbots(
  project_id: string,
  project_secret: string,
): ChatbotRegistry {
  return new ChatbotRegistryImpl(project_id, project_secret);
}

class ChatbotRegistryImpl {
  #bots: Map<string, Chatbot> = new Map();
  #creds: { project_id: string; project_secret: string };

  constructor(project_id: string, project_secret: string) {
    this.#creds = { project_id, project_secret };
  }

  async register(botID: string, bot: Chatbot): Promise<void> {
    const cordUserWithMetadata: Chatbot['cordUser'] = {
      ...bot.cordUser,
      metadata: { [BOT_METADATA_KEY]: true, ...bot.cordUser.metadata },
    };
    await this.#fetch<unknown>(
      `v1/users/${botID}`,
      'PUT',
      cordUserWithMetadata,
    );
    this.#bots.set(botID, bot);
  }

  async forceRespond(botID: string, threadID: string): Promise<void> {
    // TODO: create thread if it doesn't already exist.
    const [thread, messages] = await Promise.all([
      this.#fetch<CoreThreadData>(`v1/threads/${threadID}`),
      this.#fetch<CoreMessageData[]>(
        `v1/threads/${threadID}/messages?sortDirection=ascending`,
      ),
    ]);

    await this.#doRespond(botID, messages, thread);
  }

  async webhookReceived(req: Request): Promise<boolean> {
    // Clone the request because we need the raw text here, and the json below,
    // and you can only use the body of a request once!
    await this.#validate(req.clone());

    const data: MessageCreatedWebhookEvent = await req.json();
    let type = '';
    if ('type' in data && typeof data.type === 'string') {
      type = data.type;
    }

    if (!type) {
      return false;
    }

    if (type === 'url-verification') {
      return true;
    }

    if (type !== 'thread-message-added') {
      return false;
    }

    const respondingBotIDs: string[] = [];
    await Promise.all(
      [...this.#bots.entries()].map(async ([botID, bot]) => {
        const shouldRespond = await bot.shouldRespondToEvent(data);
        if (shouldRespond) {
          respondingBotIDs.push(botID);
        }
      }),
    );

    if (respondingBotIDs.length > 0) {
      const thread: CoreThreadData = data.event.thread;
      const messages = await this.#fetch<CoreMessageData[]>(
        `v1/threads/${thread.id}/messages?sortDirection=ascending`,
      );

      await Promise.all(
        respondingBotIDs.map(
          async (botID) => await this.#doRespond(botID, messages, thread),
        ),
      );
    }

    return true;
  }

  async #doRespond(
    botID: string,
    messages: CoreMessageData[],
    thread: CoreThreadData,
  ) {
    await this.#fetch(`v1/groups/${thread.groupID}/members`, 'POST', {
      add: [botID],
    });

    const bot = this.#bots.get(botID);
    if (!bot) {
      throw new Error(`Invalid botID: ${botID}`);
    }

    let messageID: string;
    const response = await bot.getResponse(messages, thread);
    if (response === null || response === undefined) {
      return;
    } else if (typeof response === 'string') {
      ({ messageID } = await this.#fetch<{ messageID: string }>(
        `v1/threads/${thread.id}/messages`,
        'POST',
        {
          authorID: botID,
          content: stringToMessageContent(response),
          metadata: { [BOT_METADATA_KEY]: true },
        },
      ));
    } else if (isAsyncIterable(response)) {
      void this.#typing(thread.id, botID, true);
      const typingInterval = setInterval(
        () => void this.#typing(thread.id, botID, true),
        1000,
      );

      try {
        ({ messageID } = await this.#fetch<{ messageID: string }>(
          `v1/threads/${thread.id}/messages`,
          'POST',
          {
            authorID: botID,
            content: [],
            metadata: { [BOT_METADATA_KEY]: true },
          },
        ));

        // TODO: is this the right way to do this? Is it too "eager", do we have
        // any backpressure issues?
        // TODO: should we provide a way to cancel an ongoing answer if someone
        // else adds a message to the thread, or some other cancellation
        // mechanism?
        let full = '';
        for await (const chunk of response) {
          if (chunk !== null && chunk !== undefined) {
            full += chunk;
          }

          await this.#fetch(
            `v1/threads/${thread.id}/messages/${messageID}`,
            'PUT',
            {
              content: stringToMessageContent(full),
              updatedTimestamp: null,
            },
          );
        }
      } finally {
        clearInterval(typingInterval);
      }

      void this.#typing(thread.id, botID, false);
    } else {
      throw new Error('Unknown response type: ' + typeof response);
    }

    if (bot.onResponseSent) {
      const responseMessage = await this.#fetch<CoreMessageData>(
        `v1/threads/${thread.id}/messages/${messageID}`,
      );
      await bot.onResponseSent(responseMessage, messages, thread);
    }
  }

  async #fetch<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: object,
  ): Promise<T> {
    return await fetchCordRESTApi<T>(endpoint, {
      ...this.#creds,
      method,
      body,
    });
  }

  async #typing(threadID: string, userID: string, present: boolean) {
    return await this.#fetch(`v1/threads/${threadID}`, 'PUT', {
      typing: present ? [userID] : [],
    });
  }

  async #validate(req: Request) {
    validateWebhookSignature(
      await req.text(),
      req.headers.get('X-Cord-Timestamp'),
      req.headers.get('X-Cord-Signature'),
      this.#creds.project_secret,
    );
  }
}
