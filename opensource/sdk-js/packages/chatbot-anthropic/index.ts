import Anthropic from '@anthropic-ai/sdk';
import { messageIsFromBot } from '@cord-sdk/chatbot-base';
import type { Chatbot } from '@cord-sdk/chatbot-base';
import type { CoreMessageData } from '@cord-sdk/types';

/**
 * Converts a message from Cord's format to a one compatible with Anthropic's
 * completion API.
 *
 * @param message Message data returned by any of Cord's
 * [message](https://docs.cord.com/rest-apis/messages) or
 * [thread](https://docs.cord.com/rest-apis/threads) APIs.
 *
 * @returns Message data in Anthropic's `MessageParam` format.
 */
export function messageToAnthropicMessage(
  message: CoreMessageData,
): Anthropic.MessageParam {
  return {
    role: messageIsFromBot(message) ? 'assistant' : 'user',
    content: message.plaintext,
  };
}

type MessageCreateParams = Omit<
  Anthropic.MessageCreateParamsStreaming,
  'stream'
>;

/**
 * Provides a `getResponse` function which connects to [Anthropic's messages
 * API](https://docs.anthropic.com/claude/reference/messages_post)
 * and streams the response back to Cord.
 *
 * @param apiKey An Anthropic API key. You can get this from [the Anthropic
 * console](https://console.anthropic.com/settings/keys).
 *
 * @param getAnthropicMessages The core of your AI logic: a function which takes a
 * Cord thread and message (the same parameters as
 * [`getResponse`](https://docs.cord.com/chatbot-ai-sdk/base-reference#Defining-a-Chatbot-3))
 * and returns data suitable for sending to Anthropic. This "suitable" data can be
 * any of the following:
 *
 * 1. An array of [Anthropic messages
 * (`MessageParam`)](https://docs.anthropic.com/claude/reference/messages_post).
 * In this case, a default model will be used (currently,
 * `claude-3-haiku-20240307`, though this may change in the future).
 *
 * 2. A full set of [Anthropic
 * `MessageCreateParams`](https://docs.anthropic.com/claude/reference/messages_post),
 * which can specify any model (or any other parameters) that you wish. The
 * `stream` parameter will be forced to `true` since this Cord SDK supports
 * streaming.
 *
 * 3. A promise which resolves to one of the above.
 *
 * @returns A function which can be used as the `getResponse` [for a `Chatbot`
 * definition in the base
 * SDK](https://docs.cord.com/chatbot-ai-sdk/base-reference#Defining-a-Chatbot-3).
 */
export function anthropicCompletion(
  apiKey: string,
  getAnthropicMessages: (
    ...p: Parameters<Chatbot['getResponse']>
  ) =>
    | Anthropic.MessageParam[]
    | Promise<Anthropic.MessageParam[]>
    | MessageCreateParams
    | Promise<MessageCreateParams>,
): Chatbot['getResponse'] {
  const anthropic = new Anthropic({ apiKey });

  return async function* response(messages, thread) {
    const createParamsOrMessages = await getAnthropicMessages(messages, thread);

    const createParams: MessageCreateParams = Array.isArray(
      createParamsOrMessages,
    )
      ? {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: createParamsOrMessages,
        }
      : createParamsOrMessages;
    const stream = await anthropic.messages.create({
      ...createParams,
      stream: true,
    });

    for await (const messageStreamEvent of stream) {
      // TODO: do we need to handle other message types? This seems to work...
      if (messageStreamEvent.type === 'content_block_delta') {
        yield messageStreamEvent.delta.text;
      }
    }
  };
}

/**
 * Uses [Anthropic's messages
 * API](https://docs.anthropic.com/claude/reference/messages_post) to create a
 * simple AI assistant. This is a simple wrapper on top of `anthropicCompletion`
 * which just injects the system prompt at the top of the list of messages. It
 * uses a default model (currently, `claude-3-haiku-20240307`, though this may
 * change in the future).
 *
 * @param apiKey An Anthropic API key. You can get this from [the Anthropic
 * console](https://console.anthropic.com/settings/keys).
 *
 * @param systemPrompt The system prompt to use to set the behavior of the AI.
 *
 * @returns A function which can be used as the `getResponse` [for a `Chatbot`
 * definition in the base
 * SDK](https://docs.cord.com/chatbot-ai-sdk/base-reference#Defining-a-Chatbot-3).
 */
export function anthropicSimpleAssistant(
  apiKey: string,
  systemPrompt: string,
): Chatbot['getResponse'] {
  return anthropicCompletion(apiKey, (messages, _thread) => ({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map(messageToAnthropicMessage),
  }));
}
