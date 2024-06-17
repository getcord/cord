import { cordifyClassname } from 'common/ui/style.ts';
import * as emptyStateClasses from 'external/src/components/2/EmptyStateWithFacepile.css.js';

export const comments = cordifyClassname('threaded-comments');
export const unresolvedOnly = cordifyClassname(
  'threaded-comments-unresolved-only',
);
export const resolvedOnly = cordifyClassname('threaded-comments-resolved-only');

export const tabContainer = cordifyClassname('threaded-comments-tab-container');
export const tab = cordifyClassname('threaded-comments-tab');

export const threadList = cordifyClassname('threaded-comments-thread-list');
export const expandResolvedButton = cordifyClassname(
  'threaded-comments-expand-resolved-button',
);

export const thread = cordifyClassname('threaded-comments-thread');
export const resolvedThreadHeader = cordifyClassname(
  'threaded-comments-resolved-thread-header',
);
export const reopenButton = cordifyClassname('threaded-comments-reopen-button');
export const expandReplies = cordifyClassname('expand-replies');
export const repliesContainer = cordifyClassname('replies-container');
export const hideReplies = cordifyClassname('hide-replies');
export const showMore = cordifyClassname('show-more');
export const viewerAvatarWithComposer = cordifyClassname(
  'viewer-avatar-with-composer',
);

export const threadedCommentsClassnameDocs = {
  [tabContainer]:
    'Applied to the tabs that appear on the top of the component.',
  [tab]:
    'Applied to the individual "Open" and "Resolved" buttons within the aforementioned `tabContainer`.',
  [threadList]:
    'Applied to the high-level list of threads. Although it is a list of threads, it is not actually a `ThreadList` component, hence the long name.',
  [expandResolvedButton]:
    'Applied to the "Show resolved threads" button, which appears when the display resolved property is set to `sequentially`.',
  [emptyStateClasses.emptyStatePlaceholderContainer]:
    'Applied to the container of the placeholder that appears when there are no messages.',
  [emptyStateClasses.emptyStatePlaceholderTitle]:
    'Applied to the title of the placeholder when there are no messages.',
  [emptyStateClasses.emptyStatePlaceholderBody]:
    'Applied to the body of the placeholder when there are no messages.',
  [thread]:
    'Applied to an individual thread. Although it represents a thread, it is not actually a `Thread` component, hence the long name.',
  [resolvedThreadHeader]:
    'Applied to the header which appears above the avatar and name of resolved threads.',
  [reopenButton]:
    'Applied to the "Reopen" button, which appears when hovering on the header of a resolved thread.',
  [expandReplies]:
    'Applied to the button below the first message of each thread, to expand the replies to that thread.',
  [repliesContainer]:
    'Applied to the container holding the `Message` components which are the replies to a thread. This may appear below the initial message of a thread.',
  [hideReplies]: 'Applied to the "hide replies" button.',
  [showMore]:
    'Applied to the button to load more threads, as well as the button to load more messages in a thread.',
  [viewerAvatarWithComposer]:
    'Applied to the container containing the combined viewer avatar and composer, which can appear inside each thread as the "reply" composer.',
};
