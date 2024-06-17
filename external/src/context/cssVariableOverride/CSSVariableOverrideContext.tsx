import { createContext } from 'react';
import type { Button2CSSVariablesOverride } from 'external/src/components/ui2/Button2.tsx';
import type { InlineThreadComponent2CSSOverrides } from 'external/src/components/2/thread2/InlineThread.tsx';
import type { AvatarComponentOverrides } from 'external/src/components/ui2/Avatar2.tsx';
import { NO_PROVIDER_DEFINED } from 'external/src/common/const.ts';

type CSSVariableOverrideContextType = {
  composerSendButton: Button2CSSVariablesOverride;
  inlineThread: InlineThreadComponent2CSSOverrides;
  avatar: AvatarComponentOverrides;
};
const DO_NOT_EXPORT_cssVariableOverrideContext: CSSVariableOverrideContextType =
  {
    composerSendButton: {},
    inlineThread: {},
    avatar: {},
  } as const;

export function makeCSSVariableOverrideContext(
  overrides: Partial<CSSVariableOverrideContextType>,
): CSSVariableOverrideContextType {
  return {
    ...DO_NOT_EXPORT_cssVariableOverrideContext,
    ...overrides,
  };
}

export const CSSVariableOverrideContext = createContext<
  CSSVariableOverrideContextType | typeof NO_PROVIDER_DEFINED
>(NO_PROVIDER_DEFINED);

/**
 * Used in components that don't have any overrides yet, e.g. SelectionComments
 */
export function DisabledCSSVariableOverrideContextProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <CSSVariableOverrideContext.Provider
      value={DO_NOT_EXPORT_cssVariableOverrideContext}
    >
      {children}
    </CSSVariableOverrideContext.Provider>
  );
}
