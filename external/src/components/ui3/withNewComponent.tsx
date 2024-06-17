import { createContext, forwardRef, useContext } from 'react';
import type { ElementType } from 'react';
import { useFeatureFlag } from 'external/src/effects/useFeatureFlag.ts';
import { FeatureFlags } from 'common/const/FeatureFlags.ts';

const ALL_NEW_COMPONENTS = [
  'avatar',
  'bulletElement',
  'composer',
  'connectToSlack',
  'icon',
  'imageModal',
  'facepile',
  'message',
  'messageFilesAttachments',
  'notificationList',
  'notificationListLauncher',
  'scrollContainer',
  'settings',
  'simpleInlineMenu',
  'structuredMessage',
  'thread',
  'threadHeader',
  'threadList',
  'threadWithProvider',
  'threadMessageSeenBy',
  'toastPopup',
  'todoElement',
  'userReferenceElement',
  'userReferenceSuggestions',
  'optionsMenu',
] as const;
type NewComponents = (typeof ALL_NEW_COMPONENTS)[number];
/**
 * Specify whether you want to use the new version of a component.
 * The new component is easier to be styled with CSS.
 * You can add style in a `<style id="cord_style></style>` in your application header.
 * This is likely breaking your app, and requires some careful migration.
 *
 * You can set this to `undefined` to enable Cord's default behaviour again.
 **/
export type NewComponentSwitchConfig = Partial<{
  [newComp in NewComponents]: boolean;
}>;

export const ENABLE_ALL_NEW_COMPONENTS_CONFIG = Object.fromEntries(
  ALL_NEW_COMPONENTS.map((key) => [key, true]),
);

type ConfigKeys = keyof NewComponentSwitchConfig;

const SwitchNewComponent = forwardRef(function SwitchNewComponent(
  {
    OldComp,
    NewComp,
    configKey,
    ...props
  }: {
    OldComp: React.ComponentType<React.ComponentPropsWithRef<ElementType<any>>>;
    NewComp: typeof OldComp;
    configKey: ConfigKeys;
  },
  ref: React.Ref<unknown>,
) {
  // Checks feature toggle first,
  // but let overrides with local config from context.
  const shoudlUseNewCompConfig = {
    ...(useFeatureFlag(
      FeatureFlags.USE_NEW_CSS_COMPONENTS,
    ) as NewComponentSwitchConfig),
    ...useContext(NewComponentSwitchContext),
  };
  const shouldUseNewComp = !!shoudlUseNewCompConfig[configKey];

  return shouldUseNewComp ? (
    <NewComp {...props} ref={ref} />
  ) : (
    <OldComp {...props} ref={ref} />
  );
});

export function withNewCSSComponentMaybe<CompPropsType extends object>(
  config: {
    NewComp: React.ComponentType<CompPropsType>;
    configKey: ConfigKeys;
  },
  OldComp: React.ComponentType<CompPropsType>,
) {
  return forwardRef((props: CompPropsType, ref: React.Ref<unknown>) => (
    <SwitchNewComponent OldComp={OldComp} {...config} {...props} ref={ref} />
  )) as React.ForwardRefExoticComponent<CompPropsType>;
}

export const NewComponentSwitchContext = createContext<
  NewComponentSwitchConfig | undefined
>({});
