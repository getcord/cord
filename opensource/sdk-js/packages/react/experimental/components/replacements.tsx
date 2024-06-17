import { atom } from 'jotai';
import type { WritableAtom } from 'jotai';
import type {
  ComposerProps,
  MessageProps,
  AvatarProps,
  AvatarFallbackProps,
  AvatarTooltipProps,
  ThreadProps,
  ThreadsProps,
} from '../../experimental/types.js';
import type { TextEditorProps } from '../../canary/composer/TextEditor.js';
import type { ComposerLayoutProps } from '../../canary/composer/ComposerLayout.js';
import type { ToolbarLayoutProps } from '../../canary/composer/ToolbarLayout.js';
import type { MessageLayoutProps } from '../../canary/message/MessageLayout.js';
import type { ThreadHeaderProps } from '../../canary/thread/ThreadHeader.js';
import type { SendButtonProps } from '../../canary/composer/SendButton.js';
import type {
  UsernameProps,
  UsernameTooltipProps,
} from '../../canary/message/Username.js';
import type { MessageTombstoneProps } from '../../canary/message/MessageTombstone.js';
import type { ActionMessageProps } from '../../canary/message/ActionMessage.js';
import type { ResolvedThreadComposerProps } from '../../canary/composer/ResolvedThreadComposer.js';
import type { CloseComposerButtonProps } from '../../canary/composer/CloseComposerButton.js';
import type { ReopenThreadButtonProps } from '../../canary/composer/ReopenThreadButton.js';
import type { ThreadSeenByProps } from '../../canary/thread/ThreadSeenBy.js';
import type { ToastFunctionProviderProps } from '../contexts/ToastContext.js';
import type { SendMessageErrorProps } from '../../canary/composer/SendMessageError.js';
import type { ScrollContainerProps } from '../../canary/ScrollContainer.js';
import type { ThreadLayoutProps } from '../../canary/thread/ThreadLayout.js';
import type { TypingIndicatorProps } from '../../canary/thread/TypingIndicator.js';
import type { ComposerAttachmentInputProps } from '../../canary/composer/ComposerAttachmentInput.js';
import type { ThreadsLayoutProps } from '../../canary/threads/ThreadsLayout.js';
import type { InlineThreadProps } from '../../canary/threads/InlineThread.js';
import type { InlineComposerProps } from '../../canary/threads/InlineComposer.js';
import type { DragAndDropProps } from '../../canary/composer/WithDragAndDrop.js';
import type { InlineReplyButtonProps } from '../../canary/threads/InlineReplyButton.js';
import type { InlineThreadCollapsedLayoutProps } from '../../canary/threads/InlineThreadCollapsedLayout.js';
import type { InlineThreadExpandedLayoutProps } from '../../canary/threads/InlineThreadExpandedLayout.js';
import type { LoadingIndicatorProps } from '../../components/LoadingIndicator.js';
import type { EmptyPlaceholderProps } from '../../canary/EmptyPlaceholder.js';
import type {
  InlineThreadHeaderButtonProps,
  InlineThreadHeaderProps,
  InlineThreadHeaderTitleProps,
} from '../../canary/threads/InlineThreadHeader.js';
import type { TabbedThreadsProps } from '../../canary/threads/TabbedThreads.js';
import type { OverlayProps } from './Overlay.js';
import type { FacepileProps } from './Facepile.js';
import type { PresenceFacepileProps } from './PresenceFacepile.js';
import type { PagePresenceProps } from './PagePresence.js';
import type { GeneralButtonProps } from './helpers/Button.js';
import type {
  OptionsMenuProps,
  OptionsMenuTooltipProps,
} from './menu/OptionsMenu.js';
import type { MenuProps } from './menu/Menu.js';
import type { MenuButtonProps } from './menu/MenuButton.js';
import type { MessageFilesAttachmentsProps } from './message/MessageFilesAttachments.js';
import type { MediaModalProps } from './MediaModal.js';
import type { MessageUserReferenceElementProps } from './message/MessageUserReferenceElement.js';
import type { MessageTextProps } from './message/MessageText.js';
import type { MessageContentProps } from './message/MessageContent.js';
import type { MenuItemProps } from './menu/MenuItem.js';
import type { SeparatorProps } from './helpers/Separator.js';
import type { MessageActionsProps } from './menu/MessageActions.js';
import type { TimestampProps } from './Timestamp.js';
import type { EmojiPickerProps } from './helpers/EmojiPicker.js';
import type { ReactionsProps } from './Reactions.js';
import type { ReactionPickButtonProps } from './ReactionPickButton.js';
import type { ErrorFallbackProps } from './ErrorFallback.js';
import type { MentionListProps } from './composer/MentionList.js';
import type { ShareToEmailFormProps } from './menu/ShareToEmailForm.js';
import type { MessageLinkPreviewsProps } from './message/MessageLinkPreviews.js';
import type { MessageLinkPreviewProps } from './message/MessageLinkPreview.js';
import type { VirtualizedMenuProps } from './menu/VirtualizedMenu.js';

interface PleaseWrapYourReplacementInForwardRef<T>
  extends React.ForwardRefExoticComponent<T> {}

export type ReplaceConfig = ReplaceConfigBase & ReplaceWithin;

export type ReplaceConfigBase = Partial<{
  ActionMessage: React.ComponentType<ActionMessageProps>;
  Avatar: PleaseWrapYourReplacementInForwardRef<AvatarProps>;
  AvatarFallback: React.ComponentType<AvatarFallbackProps>;
  AvatarTooltip: React.ComponentType<AvatarTooltipProps>;
  Button: PleaseWrapYourReplacementInForwardRef<GeneralButtonProps>;
  CloseComposerButton: React.ComponentType<CloseComposerButtonProps>;
  Composer: React.ComponentType<ComposerProps>;
  ComposerLayout: PleaseWrapYourReplacementInForwardRef<ComposerLayoutProps>;
  ComposerAttachmentInput: PleaseWrapYourReplacementInForwardRef<ComposerAttachmentInputProps>;
  DragAndDrop: PleaseWrapYourReplacementInForwardRef<DragAndDropProps>;
  EmojiPicker: React.ComponentType<EmojiPickerProps>;
  EmptyPlaceholder: React.ComponentType<EmptyPlaceholderProps>;
  ErrorFallback: React.ComponentType<ErrorFallbackProps>;
  Facepile: React.ComponentType<FacepileProps>;
  InlineThreadHeader: React.ComponentType<InlineThreadHeaderProps>;
  InlineThreadHeaderTitle: React.ComponentType<InlineThreadHeaderTitleProps>;
  InlineThreadHeaderButton: React.ComponentType<InlineThreadHeaderButtonProps>;
  MediaModal: React.ComponentType<MediaModalProps>;
  MentionList: React.ComponentType<MentionListProps>;
  Menu: React.ComponentType<MenuProps>;
  MenuButton: React.ComponentType<MenuButtonProps>;
  MenuItem: React.ComponentType<MenuItemProps>;
  Message: PleaseWrapYourReplacementInForwardRef<MessageProps>;
  MessageActions: React.ComponentType<MessageActionsProps>;
  MessageContent: React.ComponentType<MessageContentProps>;
  MessageFilesAttachments: React.ComponentType<MessageFilesAttachmentsProps>;
  MessageLayout: React.ComponentType<MessageLayoutProps>;
  MessageLinkPreviews: React.ComponentType<MessageLinkPreviewsProps>;
  MessageLinkPreview: React.ComponentType<MessageLinkPreviewProps>;
  MessageText: React.ComponentType<MessageTextProps>;
  MessageTombstone: React.ComponentType<MessageTombstoneProps>;
  MessageUserReferenceElement: React.ComponentType<MessageUserReferenceElementProps>;
  OptionsMenu: React.ComponentType<OptionsMenuProps>;
  OptionsMenuTooltip: React.ComponentType<OptionsMenuTooltipProps>;
  Overlay: React.ComponentType<OverlayProps>;
  PagePresence: React.ComponentType<PagePresenceProps>;
  PresenceFacepile: React.ComponentType<PresenceFacepileProps>;
  ReactionButton: React.ComponentType<ReactionPickButtonProps>;
  Reactions: React.ComponentType<ReactionsProps>;
  ReopenThreadButton: React.ComponentType<ReopenThreadButtonProps>;
  Replace: React.ComponentType<object>;
  ResolvedThreadComposer: React.ComponentType<ResolvedThreadComposerProps>;
  ScrollContainer: React.ComponentType<ScrollContainerProps>;
  SendButton: React.ComponentType<SendButtonProps>;
  SendMessageError: React.ComponentType<SendMessageErrorProps>;
  Separator: React.ComponentType<SeparatorProps>;
  ShareToEmailForm: React.ComponentType<ShareToEmailFormProps>;
  TabbedThreads: React.ComponentType<TabbedThreadsProps>;
  TextEditor: React.ComponentType<TextEditorProps>;
  Thread: React.ComponentType<ThreadProps>;
  ThreadHeader: React.ComponentType<ThreadHeaderProps>;
  ThreadLayout: React.ComponentType<ThreadLayoutProps>;
  ThreadSeenBy: PleaseWrapYourReplacementInForwardRef<ThreadSeenByProps>;
  Timestamp: React.ComponentType<TimestampProps>;
  ToastFunctionProvider: React.ComponentType<ToastFunctionProviderProps>;
  ToolbarLayout: React.ComponentType<ToolbarLayoutProps>;
  TypingIndicator: React.ComponentType<TypingIndicatorProps>;
  Username: React.ComponentType<UsernameProps>;
  UsernameTooltip: React.ComponentType<UsernameTooltipProps>;
  Threads: React.ComponentType<ThreadsProps>;
  ThreadsLayout: React.ComponentType<ThreadsLayoutProps>;
  InlineThread: PleaseWrapYourReplacementInForwardRef<InlineThreadProps>;
  InlineThreadCollapsedLayout: React.ComponentType<InlineThreadCollapsedLayoutProps>;
  InlineThreadExpandedLayout: React.ComponentType<InlineThreadExpandedLayoutProps>;
  InlineComposer: React.ComponentType<InlineComposerProps>;
  InlineReplyButton: PleaseWrapYourReplacementInForwardRef<InlineReplyButtonProps>;
  VirtualizedMenu: React.ComponentType<VirtualizedMenuProps>;
  LoadingIndicator: PleaseWrapYourReplacementInForwardRef<LoadingIndicatorProps>;
}>;

export type MandatoryReplaceableProps = { 'data-cord-replace'?: string };

type ReplaceWithin = Partial<{
  within: { [name in keyof ReplaceConfigBase]?: ReplaceConfigBase };
}>;

export type ComponentName = keyof ReplaceConfigBase;
export const replaceRegistry = new Map<string, AnyWritableAtom>();

export function registerComponent<
  ReplacedComponent extends React.ComponentType<any>,
>(name: string, component: ReplacedComponent) {
  replaceRegistry.set(name, atom({ component }));
}

type AnyWritableAtom = WritableAtom<
  { component: React.ComponentType<any>; replace?: any },
  any[],
  any
>;
