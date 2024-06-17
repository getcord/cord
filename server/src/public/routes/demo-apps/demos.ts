import { DOCS_ORIGIN } from 'common/const/Urls.ts';
import { MessageNodeType } from 'common/types/index.ts';
import { secondsToFormattedTimestamp } from 'common/util/secondsToFormattedTimestamp.ts';
import {
  createMessageNode,
  createParagraphNode,
} from '@cord-sdk/react/common/lib/messageNode.ts';
import type { OrgEntity } from 'server/src/entity/org/OrgEntity.ts';
import type { UserEntity } from 'server/src/entity/user/UserEntity.ts';
import {
  addReplyToThread,
  createDummyViewer,
  createDemoAppsMessage,
  getDashboardExternalThreadId,
} from 'server/src/public/routes/demo-apps/utils.ts';
import { getNewLoaders } from 'server/src/RequestContextLoaders.ts';

export type PopulateDemoDataType = {
  org: OrgEntity;
  anonymousUser: UserEntity;
  dummyUsers: UserEntity[];
};

export async function populateDocumentDemoWithData({
  org,
  anonymousUser,
  dummyUsers,
}: PopulateDemoDataType) {
  const { thread, threadParticipantMutator } = await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Document Demo',
    sentBy: dummyUsers[0],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/document`,
    cordLocation: { page: 'document' },
    messageAnnotationType: 'document',
    threadMetadata: {
      startNodeId: 'p1',
      startOffset: 57,
      endNodeId: 'p1',
      endOffset: 60,
      floatingThreadVisible: true,
    },
    content: [createParagraphNode('You can customize every element of the UI')],
  });

  const dummyUserTwoViewer = await createDummyViewer(dummyUsers[1], org);
  const dummyUserTwoLoaders = await getNewLoaders(dummyUserTwoViewer);

  await addReplyToThread({
    thread,
    senderViewer: dummyUserTwoViewer,
    senderLoaders: dummyUserTwoLoaders,
    threadParticipantMutator,
    cordLocation: { page: 'document' },
    replyContent: [
      createParagraphNode(
        'While stuff like file attachments, timestamps, and real-time delivery are taken care of out-of-the-box',
      ),
    ],

    replyReactions: ['✨', '🏃'],
  });

  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Document Demo',
    sentBy: dummyUsers[2],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/document`,
    cordLocation: { page: 'document' },
    messageAnnotationType: 'document',
    threadMetadata: {
      startNodeId: 'p2',
      startOffset: 7,
      endNodeId: 'p2',
      endOffset: 20,
      floatingThreadVisible: true,
    },
    content: [
      createParagraphNode(
        'Reply or react to one of the comments already on the page, or highlight some text and add your own',
      ),
    ],
  });
}

export async function populateDashboardDemoWithData({
  org,
  anonymousUser,
  dummyUsers,
}: PopulateDemoDataType) {
  // The metadata and ID must match the logic in sample-apps/dashboard/src/components/HighchartsExample.tsx
  const dashboardChartThreadMetadata = {
    type: 'chart',
    // matches the id in sample-apps/dashboard/src/components/Dashboard.tsx
    chartId: 'some-unique-and-stable-id-of-this-chart',
    // matches the id in sample-apps/dashboard/src/chartData.json
    seriesId: 'unique-id-of-this-series-2',
    seriesName: 'Notion',
    x: 2014,
    y: 82.07,
    // For us to open the thread initially on the client side
  };
  const dashboardChartThreadExternalId = getDashboardExternalThreadId(
    dashboardChartThreadMetadata,
    org.externalID,
  );
  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Dashboard Demo',
    sentBy: dummyUsers[0],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/dashboard`,
    cordLocation: { page: 'dashboard' },
    messageAnnotationType: 'dashboard',
    threadExternalId: dashboardChartThreadExternalId,
    threadMetadata: dashboardChartThreadMetadata,
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          {
            text: `${dashboardChartThreadMetadata.seriesName}: ${dashboardChartThreadMetadata.x} Market cap`,
            class: `metadata-quote ${dashboardChartThreadMetadata.seriesName.toLowerCase()}`,
          },
        ],
      }),
      createParagraphNode(
        'Click any data point to leave a comment on the chart (or just reply to this one)',
      ),
    ],
    addReply: false,
  });

  const dashboardChartThread2Metadata = {
    type: 'chart',
    chartId: 'some-unique-and-stable-id-of-this-chart',
    seriesId: 'unique-id-of-this-series',
    seriesName: 'Figma',
    x: 2020,
    y: 129.99,
  };
  const dashboardChartThread2ExternalId = getDashboardExternalThreadId(
    dashboardChartThread2Metadata,
    org.externalID,
  );
  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Dashboard Demo',
    sentBy: dummyUsers[1],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/dashboard`,
    cordLocation: { page: 'dashboard' },
    messageAnnotationType: 'dashboard',
    threadExternalId: dashboardChartThread2ExternalId,
    threadMetadata: dashboardChartThread2Metadata,
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          {
            text: `${dashboardChartThread2Metadata.seriesName}: ${dashboardChartThread2Metadata.x} Market cap`,
            class: `metadata-quote ${dashboardChartThread2Metadata.seriesName.toLowerCase()}`,
          },
        ],
      }),
      createParagraphNode(
        "You can have conversations with your team where it's most important",
      ),
    ],
    addReply: false,
  });

  const dashboardGridThreadMetadata = {
    type: 'grid',
    headerName: 'Figma',
    colId: 'figma-valuation',
    gridId: 'some-unique-and-stable-id-of-this-grid',
    rowId: 2015,
  };

  const dashboardGridThreadExternalId = `${org.externalID}_${dashboardGridThreadMetadata.gridId}_${dashboardGridThreadMetadata.rowId}_${dashboardGridThreadMetadata.colId}`;
  const { thread, threadParticipantMutator } = await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Dashboard Demo',
    sentBy: dummyUsers[2],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/dashboard`,
    cordLocation: { page: 'dashboard' },
    messageAnnotationType: 'dashboard',
    threadExternalId: dashboardGridThreadExternalId,
    threadMetadata: dashboardGridThreadMetadata,
    addReply: false,
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          {
            text: `${dashboardGridThreadMetadata.headerName}: ${dashboardGridThreadMetadata.rowId} Revenue`,
            class: `metadata-quote ${dashboardGridThreadMetadata.headerName.toLowerCase()}`,
          },
        ],
      }),
      createParagraphNode('You can also leave comments on any of the cells.'),
    ],
  });

  const dummyUserTwoViewer = await createDummyViewer(dummyUsers[2], org);
  const dummyUserTwoLoaders = await getNewLoaders(dummyUserTwoViewer);

  await addReplyToThread({
    thread,
    senderViewer: dummyUserTwoViewer,
    senderLoaders: dummyUserTwoLoaders,
    threadParticipantMutator,
    cordLocation: { page: 'dashboard-new' },
    replyContent: [createParagraphNode('Give it a try!')],
    replyReactions: [],
  });
}

export async function populateVideoDemoWithData({
  org,
  anonymousUser,
  dummyUsers,
}: PopulateDemoDataType) {
  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Video player Demo',
    sentBy: dummyUsers[0],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/video-player`,
    cordLocation: { page: 'video' },
    messageAnnotationType: 'videoPlayer',
    threadMetadata: {
      xPercent: 90,
      yPercent: 10,
      timestamp: 0,
      initallyOpen: true,
    },
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          { text: `${secondsToFormattedTimestamp(0)} `, class: 'timestamp' },
          { text: 'Drop comments anywhere in the video… try it!' },
        ],
      }),
    ],
    addReply: false,
  });

  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Video player Demo',
    sentBy: dummyUsers[2],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/video-player`,
    cordLocation: { page: 'video' },
    messageAnnotationType: 'videoPlayer',
    threadMetadata: {
      xPercent: 85,
      yPercent: 20,
      timestamp: 4,
      durationOnVideo: 6,
    },
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          { text: `${secondsToFormattedTimestamp(4)} `, class: 'timestamp' },
          { text: 'You can reply, react, and resolve comments, too' },
        ],
      }),
    ],
  });

  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Video player Demo',
    sentBy: dummyUsers[1],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/video-player`,
    cordLocation: { page: 'video' },
    messageAnnotationType: 'videoPlayer',
    threadMetadata: {
      xPercent: 20,
      yPercent: 30,
      timestamp: 21,
    },
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          { text: `${secondsToFormattedTimestamp(21)} `, class: 'timestamp' },
          { text: 'Click this comment and see what happens 👀' },
        ],
      }),
    ],
  });

  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Video player Demo',
    sentBy: dummyUsers[2],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/video-player`,
    cordLocation: { page: 'video' },
    messageAnnotationType: 'videoPlayer',
    threadMetadata: {
      xPercent: 80,
      yPercent: 85,
      timestamp: 23,
      durationOnVideo: 2,
    },
    content: [
      createMessageNode(MessageNodeType.PARAGRAPH, {
        children: [
          { text: `${secondsToFormattedTimestamp(23)} `, class: 'timestamp' },
          {
            text: 'Way better than giving feedback over Slack and e-mail alongside timestamps, right?',
          },
        ],
      }),
    ],
  });
}

export async function populateCanvasDemoWithData({
  org,
  anonymousUser,
  dummyUsers,
}: PopulateDemoDataType) {
  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Canvas Demo',
    sentBy: dummyUsers[0],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/canvas-new`,
    cordLocation: { page: 'canvas-new' },
    messageAnnotationType: 'canvas-new',
    threadMetadata: {
      elementName: 'square',
      relativeX: 330,
      relativeY: 100,
    },
    content: [createParagraphNode('Build comments just like Figma or Miro!')],
  });

  await createDemoAppsMessage({
    org,
    anonymousUser,
    threadTitle: 'Canvas Demo',
    sentBy: dummyUsers[1],
    URL: `${DOCS_ORIGIN}/get-started/demo-apps/canvas-new`,
    cordLocation: { page: 'canvas-new' },
    messageAnnotationType: 'canvas-new',
    threadMetadata: {
      elementName: 'circle',
      relativeX: -45,
      relativeY: 15,
    },
    content: [
      createParagraphNode(
        'Hey you found me! Why not try clicking and dragging the shapes about?',
      ),
    ],
  });
}
