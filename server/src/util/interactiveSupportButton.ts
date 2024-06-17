import type { KnownBlock } from '@slack/web-api';
import type { UUID } from 'common/types/index.ts';

export function supportStatusButton(
  action: 'close' | 'open',
  threadID: UUID,
): KnownBlock {
  const buttonText = {
    close: ':tada: Close thread',
    open: ':leftwards_arrow_with_hook: Reopen thread',
  };

  return {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: buttonText[action],
          emoji: true,
        },
        value: `${action}_${threadID}`,
        action_id: `support_${action}_thread`,
      },
    ],
  };
}
