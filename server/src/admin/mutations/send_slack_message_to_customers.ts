import type { ConversationsListResponse } from '@slack/web-api';
import { WebClient } from '@slack/web-api';
import { CORD_UPDATES_TEST_CHANNEL_ID } from 'common/const/Ids.ts';
import type { Resolvers } from 'server/src/admin/resolverTypes.ts';
import {
  AuthProviderType,
  assertViewerHasUser,
} from 'server/src/auth/index.ts';
import env from 'server/src/config/Env.ts';
import { sendMessageToCord } from 'server/src/slack/util.ts';
export const sendSlackMessageToCustomersMutationResolver: Resolvers['Mutation']['sendSlackMessageToCustomers'] =
  async (_, args, context) => {
    const { type, message, customers: selectedCustomers } = args;

    const client = new WebClient(env.SLACK_CUSTOMER_UPDATES_BOT_TOKEN);

    try {
      // Sending to customers or to our 'cord-updates-test' channel
      if (type === 'customer') {
        if (env.CORD_TIER === 'prod') {
          const customersOnSlack = await fetchSelectedCustomersSlackChannels(
            selectedCustomers,
            client,
          );

          const errors: {
            channelID: string;
            error: string;
            channelName: string;
          }[] = [];

          await Promise.all(
            customersOnSlack.map(async ([channelName, channelID]) => {
              const response = await client.chat.postMessage({
                token: env.SLACK_CUSTOMER_UPDATES_BOT_TOKEN,
                channel: channelID,
                text: message,
              });

              if (!response.ok && response.error) {
                errors.push({
                  channelID,
                  error: response.error,
                  channelName,
                });
              }
            }),
          );

          if (env.CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID) {
            await sendMessageToCord(
              `A broadcast was sent to ${
                customersOnSlack.length
              } customer channels${
                errors.length > 0 ? ` (${errors.length} errors)` : ''
              }:\n\n${message}`,
              env.CORD_ALL_CUSTOMERS_SLACK_CHANNEL_ID,
              'clack-allcustomers',
            );
          }

          if (errors.length > 0) {
            context.logger.error('Error posting slack messages', {
              errorMessages: errors,
            });
            return { success: false, failureDetails: null };
          }
          return { success: true, failureDetails: null };
        } else {
          // Test message to cord-updates-test channel
          const response = await client.chat.postMessage({
            token: env.SLACK_CUSTOMER_UPDATES_BOT_TOKEN,
            channel: CORD_UPDATES_TEST_CHANNEL_ID,
            text: message,
          });

          if (!response.ok || response.error) {
            throw new Error('Test message to test channel failed');
          }

          return { success: true, failureDetails: null };
        }
      } else {
        const userID = assertViewerHasUser(context.session.viewer);

        const user = await context.loaders.userLoader.loadUser(userID);

        if (
          !user ||
          !user.admin ||
          !user.externalID ||
          user.externalProvider !== AuthProviderType.SLACK
        ) {
          throw new Error('Could not find user');
        }

        // Test message to yourself (via the Cord Updates App)
        const response = await client.chat.postMessage({
          token: env.SLACK_CUSTOMER_UPDATES_BOT_TOKEN,
          channel: user.externalID,
          text: message,
        });

        if (!response.ok || response.error) {
          throw new Error('Test message failed');
        }

        return { success: true, failureDetails: null };
      }
    } catch (error) {
      let errorMessage = 'Something went wrong';

      if (error instanceof Error) {
        errorMessage = error.message;
        context.logger.error('sendSlackMessageToCustomersMutationResolver', {
          payload: args,
          erroMessage: error.message,
        });
      }

      return {
        success: false,
        failureDetails: {
          code: '500',
          message: errorMessage,
        },
      };
    }
  };

async function fetchSelectedCustomersSlackChannels(
  selectedCustomers: string[],
  slackClient: WebClient,
) {
  const customersOnSlack = new Map<string, string>();

  let canFetchMore = true;
  let cursor: string | undefined = undefined;

  // Have to iterate through as we don't get all the conversations in one go
  while (canFetchMore) {
    const slackConversations: ConversationsListResponse =
      await slackClient.conversations.list({
        exclude_archived: true,
        cursor,
      });

    if (
      !slackConversations ||
      !slackConversations.ok ||
      !slackConversations.channels
    ) {
      throw new Error('Something went wrong in conversations');
    }

    slackConversations.channels.forEach((channel) => {
      if (
        channel?.name &&
        channel.id &&
        selectedCustomers.includes(channel.name)
      ) {
        customersOnSlack.set(channel.name, channel.id);
      }
    });

    cursor = slackConversations.response_metadata?.next_cursor;

    canFetchMore = Boolean(cursor);
  }

  if (customersOnSlack.size !== selectedCustomers.length) {
    throw new Error(
      `Couldn't find all the channels, found ${customersOnSlack.size} channels but requested ${selectedCustomers.length} `,
    );
  }

  return Array.from(customersOnSlack);
}
