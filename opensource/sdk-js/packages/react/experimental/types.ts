import type {
  ClientCreateThread,
  ClientMessageData,
  ClientUserData,
  MessageContent,
  ViewerUserData,
  Location,
  ClientThreadData,
  ObserveThreadsOptions,
  ThreadsData,
} from '@cord-sdk/types';
import type { CustomEditor } from '../slateCustom.js';
import type { ReplacementProps } from './components/hoc/withReplacement.js';
import type { MandatoryReplaceableProps } from './components/replacements.js';

export type ByID<T> = T & React.RefAttributes<HTMLElement> & ReplacementProps;
export type WithByID<T> = {
  ByID: React.ComponentType<ByID<T>>;
};
export interface WithByIDComponent<T, U>
  extends WithByID<U>,
    React.ForwardRefExoticComponent<
      T & React.RefAttributes<HTMLElement> & ReplacementProps
    > {}

export type ByOptions<T> = T &
  React.RefAttributes<HTMLElement> &
  ReplacementProps;
export type WithByOptions<T> = {
  ByOptions: React.ComponentType<ByOptions<T>>;
};
export interface WithByOptionsComponent<T, U>
  extends WithByOptions<U>,
    React.ForwardRefExoticComponent<
      T & React.RefAttributes<HTMLElement> & ReplacementProps
    > {}

export interface StyleProps {
  /**
   * Passes the style of the component. It will be applied to the root element.
   */
  style?: React.HTMLAttributes<HTMLDivElement>['style'];
  /**
   * Any classes to be added to the component. It will be applied to the root element.
   */
  className?: React.HTMLAttributes<HTMLDivElement>['className'];
}

export interface SendComposerProps
  extends StyleProps,
    ReplacementProps,
    Pick<ComposerProps, 'expanded' | 'showCancelButton'> {
  /**
   * The initial value of the composer.
   */
  initialValue?: Partial<ClientMessageData>;
  /**
   * An [arbitrary string](/reference/identifiers) that uniquely identifies a
   * thread. Messages sent will go to the provided thread ID. If the thread does not exist,
   * then the createThread prop should be passed.
   *
   * *Warning!*
   * An important restriction of working with thread identifiers
   * is that they must be unique across your entire application.
   * You can't use the same thread identifier in two separate
   * groups. This is an intentional limitation imposed by Cord.
   */
  threadID?: string;
  /**
   * An object containing the data of the thread to be created. If the thread specified in
   * threadID exists, the message will be added to that thread and this object will be ignored.
   */
  createThread?: Partial<ClientCreateThread>;
  /**
   * Text to be displayed as a placeholder in the composer.
   */
  placeholder?: string;
  /**
   * Callback invoked before the message is sent. It receives the message data
   * as an argument and should return the modified message data. If the callback
   * returns `null`, the message will not be sent.
   */
  onBeforeSubmit?: CordComposerProps['onBeforeSubmit'];
  /**
   * Callback invoked after the message is sent.
   */
  onAfterSubmit?: CordComposerProps['onAfterSubmit'];
  /**
   * Callback invoked when the user clicks on the cancel button in the composer.
   */
  onCancel?: () => void;
  autofocus?: boolean;
  onFailSubmit?: (error: unknown) => void;
  /**
   * Allows attachments to be added by dragging and dropping within the
   * composer area. Defaults to true.
   */
  enableDragDropAttachments?: boolean;
}

export interface EditComposerProps
  extends StyleProps,
    ReplacementProps,
    Pick<ComposerProps, 'expanded' | 'showCancelButton'> {
  /**
   * The initial value of the composer.
   */
  initialValue?: Partial<ClientMessageData>;
  /**
   * The id of the message to be edited.
   */
  messageID: string;
  /**
   * Text to be displayed as a placeholder in the composer.
   */
  placeholder?: string;
  /**
   * Callback invoked before the message is sent. It receives the message data
   * as an argument and should return the modified message data. If the callback
   * returns `null`, the message will not be sent.
   */
  onBeforeSubmit?: CordComposerProps['onBeforeSubmit'];
  /**
   * Callback invoked after the message is sent.
   */
  onAfterSubmit?: CordComposerProps['onAfterSubmit'];
  /**
   * Callback invoked when the user clicks on the cancel button in the composer.
   */
  onCancel?: () => void;
  autofocus?: boolean;
  onFailSubmit?: (error: unknown) => void;
  /**
   * Allows attachments to be added by dragging and dropping within the
   * composer area. Defaults to true.
   */
  enableDragDropAttachments?: boolean;
}

export type ComposerMessageData = Partial<Omit<ClientMessageData, 'plaintext'>>;

export interface ComposerProps extends StyleProps, MandatoryReplaceableProps {
  onSubmit: (arg: { message: ComposerMessageData }) => Promise<void>;
  // TODO-ONI add cancel button
  // onCancel: () => void;
  onChange: (event: { content: MessageContent }) => void;
  onKeyDown: (event: {
    event: React.KeyboardEvent;
  }) => boolean | undefined | void;
  onCancel?: () => void;
  onResetState: (newValue?: MessageContent) => MessageContent | undefined;
  onPaste: (e: { event: React.ClipboardEvent }) => void;
  initialValue?: Partial<ClientMessageData>;
  value: Partial<Omit<ClientMessageData, 'content'>>;
  editor: CustomEditor;
  isEmpty: boolean;
  isValid: boolean;
  /**
   * When set to `auto`, the composer will auto-expand when focused.
   */
  expanded?: 'auto' | 'never' | 'always';
  showCancelButton?: boolean;
  placeholder?: string;
  toolbarItems?: NamedElements;
  extraChildren?: NamedElements;
  popperElement?: JSX.Element;
  popperElementVisible?: boolean;
  popperOnShouldHide?: () => void;
  groupID: string | undefined;
  autofocus?: boolean;
  onFailSubmit?: (error: unknown) => void;
  attachmentInputElement: JSX.Element;
  attachFilesToComposer: (files: File[]) => Promise<void>;
  enableDragDropAttachments?: boolean;
}

export type CordComposerProps = {
  initialValue?: Partial<ClientMessageData>;
  placeholder?: string;
  onBeforeSubmit?: (arg: {
    message: Partial<ClientMessageData>;
  }) => Promise<{ message: ComposerMessageData } | null>;
  onSubmit: (arg: { message: ComposerMessageData }) => Promise<void> | void;
  onAfterSubmit?: (arg: { message: Partial<ClientMessageData> }) => void;
  onCancel?: () => void;
  groupID: string | undefined;
  onFailSubmit?: (error: unknown) => void;
  onChange?: (event: { content: MessageContent }) => void;
} & Pick<
  ComposerProps,
  'expanded' | 'showCancelButton' | 'enableDragDropAttachments'
>;

export interface CommonMessageProps
  extends StyleProps,
    MandatoryReplaceableProps {}

export interface MessageProps extends CommonMessageProps {
  /**
   * Contains the data of the message to be displayed.
   */
  message: ClientMessageData;
  /**
   * If set to true, the thread options will appear within the message options menu.
   * Defaults to false.
   */
  showThreadOptions?: boolean;
}

export type MessageByIDProps = {
  /**
   * The ID of the message to be displayed.
   */
  messageID: string;
} & CommonMessageProps;

export interface CommonAvatarProps
  extends StyleProps,
    MandatoryReplaceableProps {
  /**
   * Whether to enable tooltip on the avatar.
   */
  enableTooltip?: boolean;
  /**
   * Whether the user is absent.
   */
  isAbsent?: boolean;
}
export interface AvatarProps extends CommonAvatarProps {
  /**
   * Data of the user whose avatar is to be displayed.
   */
  user: ClientUserData | null | undefined;
}

export type AvatarTooltipProps = {
  viewerData: ViewerUserData;
  userData: ClientUserData;
} & MandatoryReplaceableProps;

export type AvatarFallbackProps = {
  userData: ClientUserData;
} & StyleProps &
  MandatoryReplaceableProps;

export type PresenceObserverReactComponentProps = React.PropsWithChildren<{
  /**
   * When the user interacts with the DOM elements within the `<PresenceObserver>`,
   * they will be marked as present at this location in Cord's backend. This value
   * defaults to the current URL.
   */
  location: Location;
  /**
   * The [group](/rest-apis/groups) which should be able to see the user's presence.
   */
  groupID?: string;
  /**
   * When `true`, presence will be determined by whether or not the current document
   * is visible, rather than based on the "present" and "absent" DOM events.
   * Setting this to `true` means that `presentEvents`, `absentEvents`, and
   * `initialState` value will be ignored.
   *
   * The main situation in which you'd want to use this property is when other
   * events (like cursor and keyboard events) are not capturing user presence
   * accurately. A common case here is on very short pages where the majority
   * of the visible screen is an empty window. In these situations, you may
   * find that the user doesn't generate any mouse events since their cursor
   * isn't within the element.
   *
   * In the majority of such cases, you should consider using the `<PagePresence>`
   * component instead, because it provides both a `<PresenceObserver>` and a
   * `<PresenceFacepile>` in a single component.
   *
   * You may still want a `<PresenceObserver>` with `observeDocument` set to `true`
   * if you want to record presence on a page but not surface it. That is to say – you
   * want to observe presence, but you don't want to show a facepile. This is sometimes
   * the case when you want to record presence in one place but surface it in another place.
   *
   * The default is set to `false`.
   */
  observeDocument?: boolean;
  /**
   * When set to `true`, every user will be able to see the presence indicator for
   * any user (within the same group) who has ever been at this location at any
   * point in the past.
   *
   * When set to `false`, Cord will only show the users who are present at the same
   * location at the same time.
   *
   * The default is set to `false`.
   */
  durable?: boolean;
  /**
   * An array of event types that Cord should listen for to determine if the user
   * is present at the `location`.
   *
   * Cord marks presence and absence based on JavaScript events like `mouseenter`.
   * To do this, Cord uses a set of default event listeners that cover the majority
   * of cases. You may find that you need to set additional event listeners to
   * correctly capture a user's presence within your app.
   *
   * For each event type you list, Cord will automatically create an event listener
   * (by calling `addEventListener(<event type>, () => { ... })`). When these events
   * fire, Cord will pick up the event and mark the user as present in the
   * current location.
   *
   * Example: `['scroll', 'mousemove']`.
   *
   * The default is set to `['mouseenter', 'focusin']`.
   */
  presentEvents?: string[];
  /**
   * As with presentEvents, this value is an array of event types that Cord should
   * listen for to determine if the user has left the `location`.
   *
   * For each event type you list, Cord will automatically create an event listener
   * (by calling `addEventListener(<event type>, () => { ... })`). When these events
   * fire, Cord will pick up the event and mark the user as absent in the current location.
   *
   * Example: `['blur']`.
   *
   * The default is set to `['mouseleave', 'focusout']`.
   */
  absentEvents?: string[];
  /**
   * Callback invoked when presence state changes. This callback will receive a
   * `true` or `false` value as an argument indicating whether or not the user
   * is present at the `location`.
   */
  onChange?: (newValue: boolean) => unknown;
}>;

type CommonThreadProps = {
  /**
   * If set to `true`, the header of the thread will be displayed. Defaults to `false`.
   */
  showHeader?: boolean;
  composerExpanded?: ComposerProps['expanded'];
} & StyleProps;

export type ThreadByIDProps = {
  /**
   * The ID of the thread to be displayed.
   */
  threadID: string;
  /**
   * An object containing the data of the thread to be created. If the
   * thread already exists, this will be ignored.
   */
  createThread?: ClientCreateThread;
} & CommonThreadProps;

export interface ThreadProps
  extends CommonThreadProps,
    MandatoryReplaceableProps {
  /**
   * The data of the thread to be displayed.
   */
  threadData: ClientThreadData;
}

export type NamedElements = { name: string; element: JSX.Element | null }[];

export interface CommonThreadsProps extends StyleProps {
  /**
   * Adds a composer to allow users creating new threads.
   */
  composerOptions?: {
    /** The position of the Composer: top (YouTube style), or bottom (Slack style)  */
    position: 'top' | 'bottom';
    /** The groupID the new thread will be added to. */
    groupID: string;
  } & Partial<Omit<ClientCreateThread, 'threadID' | 'groupID'>>;
}
export interface ThreadsByOptionsProps extends CommonThreadsProps {
  /** The options that control which and how many threads are fetched. */
  options: ObserveThreadsOptions;
}
export interface ThreadsProps
  extends CommonThreadsProps,
    MandatoryReplaceableProps {
  threadsData: ThreadsData;
  /**
   * If set to `true`, the header for each inline thread will be displayed.
   * This header contains a title and a button that both link to the thread url.
   * The thread name is used as the title with the url as the fallback.
   * The default is set to `false`.
   */
  showThreadsHeader?: boolean;
}
