import type { InlineThreadComponent2CSSOverrides } from 'external/src/components/2/thread2/InlineThread.tsx';
import type { Button2CSSVariablesOverride } from 'external/src/components/ui2/Button2.tsx';
import { makeCSSVariableOverrideContext } from 'external/src/context/cssVariableOverride/CSSVariableOverrideContext.tsx';
import type { AvatarComponentOverrides } from 'external/src/components/ui2/Avatar2.tsx';

const threadCSSOverrides: Required<InlineThreadComponent2CSSOverrides> = {
  border: 'thread-border',
  borderRadius: 'thread-border-radius',
  backgroundColor: 'thread-background-color',
  padding: 'thread-padding',
};

const composerSendButtonOverrides: Omit<
  Required<Button2CSSVariablesOverride>,
  | 'gap'
  | 'iconSize'
  | 'letterSpacing'
  | 'lineHeight'
  | 'height'
  | 'border'
  | 'borderRadius'
> = {
  fontSize: 'thread-send-button-font-size',
  color: 'thread-send-button-text-color',
  colorHover: 'thread-send-button-text-color--hover',
  colorActive: 'thread-send-button-text-color--active',
  colorDisabled: 'thread-send-button-text-color--disabled',
  backgroundColor: 'thread-send-button-background-color',
  backgroundColorHover: 'thread-send-button-background-color--hover',
  backgroundColorActive: 'thread-send-button-background-color--active',
  backgroundColorDisabled: 'thread-send-button-background-color--disabled',
  padding: 'thread-send-button-padding',
};

const pagePresenceOverrides: Required<AvatarComponentOverrides> = {
  avatarSize: 'page-presence-avatar-size',
};

const presenceFacepileOverrides: Required<AvatarComponentOverrides> = {
  avatarSize: 'facepile-avatar-size',
};

export const ThreadCSSOverrides = makeCSSVariableOverrideContext({
  composerSendButton: composerSendButtonOverrides,
  inlineThread: threadCSSOverrides,
});

export const SidebarCSSOverrides = makeCSSVariableOverrideContext({
  ...ThreadCSSOverrides,
});

export const InboxCSSOverrides = makeCSSVariableOverrideContext({
  ...ThreadCSSOverrides,
});

export const PagePresenceCSSOverrides = makeCSSVariableOverrideContext({
  avatar: pagePresenceOverrides,
});

export const PresenceFacepileCSSOverrides = makeCSSVariableOverrideContext({
  avatar: presenceFacepileOverrides,
});
