import type { TaskInputType } from 'external/src/graphql/operations.ts';

export const TASK_PROVIDER_NAMES: Record<TaskInputType, string> = {
  cord: 'Cord',
  jira: 'Jira',
  asana: 'Asana',
  linear: 'Linear',
  trello: 'Trello',
  monday: 'Monday',
};

export const confirmSlackShareText = (channelName: string) => ({
  title: `Add Cord Slackbot to #${channelName}?`,
  paragraphs: [
    `Add the Cord Slackbot to #${channelName} to share messages.`,
    'You will be able to reply to Cord messages via Slack, and see recent Slack messages alongside any pages they mention.',
  ],
  confirmButtonText: 'Add and share',
  cancelButtonText: 'Cancel',
});

export const unfinishedMessageWarningText = {
  title: `Discard message?`,
  paragraphs: [
    'You have an unfinished message which will be lost if you leave now.',
  ],
  confirmButtonText: 'Discard',
  cancelButtonText: 'Keep editing',
};

export const NAV_IN_FULL_PAGE_MODAL_SIDEBAR_ID = 'navInFullPageModalSidebar';

export const FULL_PAGE_MODAL_TOP_OFFSET = 24;
