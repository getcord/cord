import { OpenAI } from 'openai';
import { messageIsFromBot } from '@cord-sdk/chatbot-base';
import type { Chatbot } from '@cord-sdk/chatbot-base';
import type { CoreMessageData } from '@cord-sdk/types';

/**
 * Converts a message from Cord's format to a one compatible with OpenAI's
 * completion API.
 *
 * @param message Message data returned by any of Cord's
 * [message](https://docs.cord.com/rest-apis/messages) or
 * [thread](https://docs.cord.com/rest-apis/threads) APIs.
 *
 * @returns Message data in [OpenAI's `ChatCompletionMessageParam`
 * format](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages).
 */
export function messageToOpenaiMessage(
  message: CoreMessageData,
): OpenAI.ChatCompletionMessageParam {
  return {
    role: messageIsFromBot(message) ? 'assistant' : 'user',
    content: message.plaintext,
  };
}

type CompletionParams = Omit<
  OpenAI.ChatCompletionCreateParamsStreaming,
  'stream'
>;

/**
 * Provides a `getResponse` function which connects to [OpenAI's completion
 * API](https://platform.openai.com/docs/guides/text-generation/chat-completions-api)
 * and streams the response back to Cord.
 *
 * @param apiKey An OpenAI API key. You can get this from [the OpenAI platform
 * website](https://platform.openai.com/api-keys).
 *
 * @param getOpenaiMessages The core of your AI logic: a function which takes a
 * Cord thread and message (the same parameters as
 * [`getResponse`](https://docs.cord.com/chatbot-ai-sdk/base-reference#Defining-a-Chatbot-3))
 * and returns data suitable for sending to OpenAI. This "suitable" data can be
 * any of the following:
 *
 * 1. An array of [OpenAI messages
 * (`ChatCompletionMessageParam`)](https://platform.openai.com/docs/api-reference/chat/create#chat-create-messages).
 * In this case, a default model will be used (currently, `gpt-4-0613`, though
 * this may change in the future).
 *
 * 2. A full set of [OpenAI
 * `CompletionParams`](https://platform.openai.com/docs/api-reference/chat/create),
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
export function openaiCompletion(
  apiKey: string,
  getOpenaiMessages: (
    ...p: Parameters<Chatbot['getResponse']>
  ) =>
    | OpenAI.ChatCompletionMessageParam[]
    | Promise<OpenAI.ChatCompletionMessageParam[]>
    | CompletionParams
    | Promise<CompletionParams>,
): Chatbot['getResponse'] {
  const openai = new OpenAI({
    apiKey,
  });

  return async function* response(messages, thread) {
    const completionParamsOrMessages = await getOpenaiMessages(
      messages,
      thread,
    );

    const completionParams: CompletionParams = Array.isArray(
      completionParamsOrMessages,
    )
      ? {
          model: 'gpt-4-0613',
          messages: completionParamsOrMessages,
        }
      : completionParamsOrMessages;
    const stream = await openai.chat.completions.create({
      ...completionParams,
      stream: true,
    });

    // TODO: is this the right way to do this? Is it too "eager", do we have any
    // backpressure issues?
    for await (const chunk of stream) {
      yield chunk.choices[0].delta.content;
    }
  };
}

/**
 * Uses [OpenAI's completion
 * API](https://platform.openai.com/docs/guides/text-generation/chat-completions-api)
 * to create a simple AI assistant. This is a simple wrapper on top of
 * `openaiCompletion` which just injects the system prompt at the top of the
 * list of messages. It uses a default model (currently, `gpt-4-0613`, though
 * this may change in the future).
 *
 * @param apiKey An OpenAI API key. You can get this from [the OpenAI platform
 * website](https://platform.openai.com/api-keys).
 *
 * @param systemPrompt The system prompt to use to set the behavior of the AI.
 *
 * @returns A function which can be used as the `getResponse` [for a `Chatbot`
 * definition in the base
 * SDK](https://docs.cord.com/chatbot-ai-sdk/base-reference#Defining-a-Chatbot-3).
 */
export function openaiSimpleAssistant(
  apiKey: string,
  systemPrompt: string,
): Chatbot['getResponse'] {
  return openaiCompletion(apiKey, (messages, _thread) => [
    { role: 'system', content: systemPrompt },
    ...messages.map(messageToOpenaiMessage),
  ]);
}
