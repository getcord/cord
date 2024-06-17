import { Sizes } from '../const/Sizes.js';
import { ZINDEX } from './zIndex.js';

const varCache: { [varName in CSSVariable]?: string } = {};

// We do not define these variables. Instead, when we call them, we call them
// with a default value. This is to avoid problems arising from our customer
// redefining the variables lower down
export const cssVariableFallbacks = {
  'color-base': { value: '#FFFFFF' },
  'color-base-strong': { value: '#F6F6F6' },
  'color-base-x-strong': { value: '#DADCE0' },
  'color-content-primary': { value: '#696A6C' },
  'color-content-secondary': { value: '#97979F' },
  'color-content-emphasis': { value: '#121314' },
  'color-brand-primary': { value: '#121314' },
  'color-notification': { value: '#0079FF' },
  'color-notification-background': { value: '#0079ff1a' },
  'color-alert': { value: '#EB5757' },
  'color-success': { value: '#71BC8F' },
  'color-focus': { value: '#CAE3F1' },
  'color-launcher': { value: '#F4FFA0' },
  'color-inherit': { value: 'inherit' },

  'space-none': { value: '0px' },
  'space-4xs': { value: '2px' },
  'space-3xs': { value: '4px' },
  'space-2xs': { value: '8px' },
  'space-xs': { value: '12px' },
  'space-s': { value: '14px' },
  'space-m': { value: '16px' },
  'space-l': { value: '20px' },
  'space-xl': { value: '24px' },
  'space-2xl': { value: '32px' },
  'space-3xl': { value: '40px' },
  'space-4xl': { value: '56px' },
  'space-auto': { value: 'auto' },

  get 'shadow-small'() {
    return {
      value: `0 ${cssVar('space-4xs')} ${cssVar(
        'space-3xs',
      )} 0 rgba(0,0,0,0.08)`,
    };
  },
  get 'shadow-large'() {
    return {
      value: `0 ${cssVar('space-4xs')} ${cssVar('space-m')} 0 rgba(0,0,0,0.16)`,
    };
  },
  get 'shadow-focus'() {
    return {
      value: `0 0 0 ${cssVar('space-4xs')} ${cssVar('color-focus')}`,
    };
  },

  'border-radius-medium': 'space-3xs',
  get 'border-radius-small'() {
    return {
      value: `calc(${cssVar('border-radius-medium')} / 2)`,
    };
  },
  get 'border-radius-large'() {
    return {
      value: `calc(${cssVar('border-radius-medium')} * 2)`,
    };
  },
  get 'border-radius-round'() {
    return {
      value: `50%`,
    };
  },

  'font-family': { value: 'inherit' },
  'font-size-body': { value: '14px' },
  'font-size-small': { value: '12px' },
  'font-weight-light': { value: '300' },
  'font-weight-medium': { value: '500' },
  'font-weight-regular': { value: '400' },
  'font-weight-bold': { value: '700' },
  'line-height-body': 'space-l',
  'line-height-small': 'space-m',

  'primary-button-background-color': 'color-brand-primary',
  'primary-button-background-color--hover': 'color-brand-primary',
  'primary-button-background-color--active': 'color-brand-primary',
  'primary-button-background-color--disabled': 'color-content-secondary',
  'primary-button-content-color': 'color-base',
  'primary-button-content-color--hover': 'color-base',
  'primary-button-content-color--active': 'color-base-x-strong',
  'primary-button-content-color--disabled': 'color-base',
  'secondary-button-background-color': 'color-base-strong',
  'secondary-button-background-color--hover': 'color-base-x-strong',
  'secondary-button-background-color--active': 'color-brand-primary',
  'secondary-button-background-color--disabled': 'color-base-strong',
  'secondary-button-content-color': 'color-content-emphasis',
  'secondary-button-content-color--hover': 'color-content-emphasis',
  'secondary-button-content-color--active': 'color-base',
  'secondary-button-content-color--disabled': 'color-content-secondary',
  'tertiary-button-background-color': { value: 'transparent' },
  'tertiary-button-background-color--hover': 'color-base-strong',
  'tertiary-button-background-color--active': 'color-base-x-strong',
  'tertiary-button-background-color--disabled': { value: 'transparent' },
  'tertiary-button-content-color': 'color-content-emphasis',
  'tertiary-button-content-color--hover': 'color-content-emphasis',
  'tertiary-button-content-color--active': 'color-content-emphasis',
  'tertiary-button-content-color--disabled': 'color-content-secondary',

  'launcher-background-color': 'color-launcher',
  'launcher-background-color--hover': 'launcher-background-color',
  'launcher-background-color--active': 'launcher-background-color',
  'launcher-content-color': 'color-content-emphasis',
  'launcher-content-color--hover': 'launcher-content-color',
  'launcher-content-color--active': 'launcher-content-color',

  // This is a one off - we should label it <component>-max-height
  // Refer to thread-max-height
  'composer-height-max': { value: 'min(40vh, 10em)' },
  // TODO Rename tall to large to match new size naming or create new CSS variable
  'composer-height-tall': { value: '200px' },
  get 'composer-height-min'() {
    return {
      value: `${cssVar('line-height-body')}`,
    };
  },
  get 'composer-border'() {
    return { value: `1px solid ${cssVar('color-base-x-strong')}` };
  },
  get 'composer-border--focus'() {
    return { value: `1px solid ${cssVar('color-content-primary')}` };
  },
  'composer-border-radius': 'border-radius-medium',

  'sidebar-background-color': 'color-base',
  'sidebar-header-background-color': 'color-base',
  'sidebar-width': { value: '312px' },
  'sidebar-z-index': { value: ZINDEX.sidebar.toString() },
  'sidebar-top': { value: '0px' },
  get 'sidebar-border-left'() {
    return { value: `1px solid ${cssVar('color-base-x-strong')}` };
  },
  'sidebar-border-top': { value: 'none' },
  'sidebar-border-right': { value: 'none' },
  'sidebar-border-bottom': { value: 'none' },

  'avatar-border-radius': 'space-3xs',
  'avatar-text-color': 'color-base',
  'avatar-background-color': 'color-brand-primary',
  'avatar-text-transform': { value: 'none' },
  'facepile-background-color': 'color-base',
  'facepile-avatar-border-width': 'space-4xs',
  'facepile-avatar-overlap': 'space-3xs',
  'facepile-avatar-size': 'space-l',

  'tooltip-background-color': 'color-brand-primary',
  'tooltip-content-color': 'color-base',

  'annotation-pin-z-index': { value: ZINDEX.annotation.toString() },
  'annotation-arrow-color': 'color-brand-primary',
  'annotation-arrow-outline-color': 'color-base',
  'annotation-pin-read-color': 'color-base',
  'annotation-pin-read-outline-color': 'color-content-secondary',
  'annotation-pin-unread-color': 'color-notification',
  'annotation-pin-unread-outline-color': 'color-base',
  'annotation-pin-unplaced-color': 'color-brand-primary',
  'annotation-pin-unplaced-outline-color': 'color-base',
  'annotation-pin-size': {
    value: `${Sizes.ANNOTATION_POINTER_SMALL_SIZE_PX.toString()}px`,
  },
  'annotation-pin-filter': {
    value: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))',
  },

  'thread-list-gap': 'space-xl',
  'thread-list-padding': 'space-2xs',
  'thread-list-height': { value: 'auto' },
  'thread-list-message-truncate-lines': { value: 'none' },
  'thread-list-thread-highlight-background-color':
    'message-highlight-background-color',
  'thread-list-thread-highlight-pill-background-color':
    'message-highlight-pill-background-color',

  // thread-border and thread-border-radius apply to InlineThread & CollapsedThread
  // When using <cord-thread />, they are applied directly to <cord-thread /> instead
  'thread-background-color': 'color-base',
  get 'thread-border'() {
    return { value: `1px solid ${cssVar('color-base-x-strong')}` };
  },
  'thread-border-top': 'thread-border',
  'thread-border-right': 'thread-border',
  'thread-border-bottom': 'thread-border',
  'thread-border-left': 'thread-border',
  'thread-border-radius': 'border-radius-medium',
  'thread-padding': { value: '0px' },

  'thread-send-button-font-size': 'font-size-body',
  'thread-send-button-text-color': 'primary-button-content-color',
  'thread-send-button-text-color--hover': 'primary-button-content-color--hover',
  'thread-send-button-text-color--active':
    'primary-button-content-color--active',
  'thread-send-button-text-color--disabled':
    'primary-button-content-color--disabled',
  'thread-send-button-background-color': 'primary-button-background-color',
  'thread-send-button-background-color--hover':
    'primary-button-background-color--hover',
  'thread-send-button-background-color--active':
    'primary-button-background-color--active',
  'thread-send-button-background-color--disabled':
    'primary-button-background-color--disabled',
  'thread-send-button-padding': 'space-2xs',
  'thread-height': { value: 'auto' },
  'thread-max-height': { value: 'none' },
  'thread-width': { value: 'auto' },

  'floating-threads-font-size': 'font-size-body',
  'floating-threads-line-height': 'line-height-body',
  'floating-threads-letter-spacing': { value: 'normal' },
  'floating-threads-text-color': 'secondary-button-content-color',
  'floating-threads-text-color--hover': 'secondary-button-content-color--hover',
  'floating-threads-text-color--active':
    'secondary-button-content-color--active',
  'floating-threads-text-color--disabled':
    'secondary-button-content-color--disabled',
  'floating-threads-background-color': 'secondary-button-background-color',
  'floating-threads-background-color--hover':
    'secondary-button-background-color--hover',
  'floating-threads-background-color--active':
    'secondary-button-background-color--active',
  'floating-threads-background-color--disabled':
    'secondary-button-background-color--disabled',
  'floating-threads-padding': { value: `6px 8px` },
  'floating-threads-height': 'button-height-auto',
  'floating-threads-gap': 'space-3xs',
  'floating-threads-border': 'button-border-none',
  'floating-threads-icon-size': 'space-l',

  'selection-comments-font-size': 'font-size-body',
  'selection-comments-line-height': 'line-height-body',
  'selection-comments-letter-spacing': { value: 'normal' },
  'selection-comments-text-color': 'secondary-button-content-color',
  'selection-comments-text-color--hover':
    'secondary-button-content-color--hover',
  'selection-comments-text-color--active':
    'secondary-button-content-color--active',
  'selection-comments-text-color--disabled':
    'secondary-button-content-color--disabled',
  'selection-comments-background-color': 'secondary-button-background-color',
  'selection-comments-background-color--hover':
    'secondary-button-background-color--hover',
  'selection-comments-background-color--active':
    'secondary-button-background-color--active',
  'selection-comments-background-color--disabled':
    'secondary-button-background-color--disabled',
  'selection-comments-padding': { value: `6px 8px` },
  'selection-comments-height': 'button-height-m',
  'selection-comments-gap': 'space-3xs',
  'selection-comments-border': 'button-border',
  'selection-comments-icon-size': 'space-l',
  'selection-comments-button-box-shadow': 'shadow-large',

  'sidebar-launcher-font-size': 'font-size-body',
  'sidebar-launcher-line-height': 'line-height-body',
  'sidebar-launcher-letter-spacing': { value: 'normal' },
  'sidebar-launcher-text-color': 'secondary-button-content-color',
  'sidebar-launcher-text-color--hover': 'secondary-button-content-color--hover',
  'sidebar-launcher-text-color--active':
    'secondary-button-content-color--active',
  'sidebar-launcher-text-color--disabled':
    'secondary-button-content-color--disabled',
  'sidebar-launcher-background-color': 'secondary-button-background-color',
  'sidebar-launcher-background-color--hover':
    'secondary-button-background-color--hover',
  'sidebar-launcher-background-color--active':
    'secondary-button-background-color--active',
  'sidebar-launcher-background-color--disabled':
    'secondary-button-background-color--disabled',
  'sidebar-launcher-padding': { value: `6px 8px` },
  'sidebar-launcher-height': 'button-height-auto',
  'sidebar-launcher-gap': 'space-3xs',
  'sidebar-launcher-border': 'button-border-none',
  'sidebar-launcher-icon-size': 'space-l',
  'sidebar-launcher-badge-background-color': 'color-notification',
  'sidebar-launcher-badge-text-color': 'color-base',

  'page-presence-avatar-size': 'facepile-avatar-size',

  'message-highlight-background-color': 'color-base-strong',
  'message-highlight-pill-background-color': 'color-base-x-strong',

  'message-status-text-new-not-subscribed': 'color-content-emphasis',
  'message-status-text-new-subscribed': 'color-notification',

  'inbox-launcher-font-size': 'font-size-body',
  'inbox-launcher-text-color': 'secondary-button-content-color',
  'inbox-launcher-text-color--hover': 'secondary-button-content-color--hover',
  'inbox-launcher-text-color--active': 'secondary-button-content-color--active',
  'inbox-launcher-text-color--disabled':
    'secondary-button-content-color--disabled',
  'inbox-launcher-background-color': 'secondary-button-background-color',
  'inbox-launcher-background-color--hover':
    'secondary-button-background-color--hover',
  'inbox-launcher-background-color--active':
    'secondary-button-background-color--active',
  'inbox-launcher-background-color--disabled':
    'secondary-button-background-color--disabled',
  'inbox-launcher-padding': { value: `6px 8px` },
  'inbox-launcher-height': 'button-height-auto',
  'inbox-launcher-gap': 'space-3xs',
  'inbox-launcher-border': 'button-border-none',
  'inbox-launcher-icon-size': 'space-l',
  'inbox-launcher-badge-background-color': 'color-notification',
  'inbox-launcher-badge-text-color': 'color-base',
  'inbox-launcher-inbox-z-index': { value: ZINDEX.popup.toString() },
  'inbox-launcher-inbox-offset': { value: '0px' },
  'inbox-launcher-inbox-box-shadow': 'shadow-large',

  'settings-background-color': 'color-base',

  'inbox-background-color': 'color-base',
  'inbox-header-background-color': 'color-base',
  'inbox-content-horizontal-padding': 'space-2xs',

  // Notification List
  'notification-list-background-color': 'color-base',
  get 'notification-list-border'() {
    return { value: `1px solid ${cssVar('color-base-x-strong')}` };
  },
  'notification-list-border-radius': 'border-radius-large',
  'notification-list-box-shadow': 'shadow-large',
  'notification-list-content-padding': 'space-xs',
  'notification-list-content-gap': 'space-xs',

  // Notification List Launcher Button
  'notification-list-launcher-font-size': 'font-size-body',
  'notification-list-launcher-text-color': 'secondary-button-content-color',
  'notification-list-launcher-text-color--hover':
    'secondary-button-content-color--hover',
  'notification-list-launcher-text-color--active':
    'secondary-button-content-color--active',
  'notification-list-launcher-text--disabled':
    'secondary-button-content-color--disabled',
  'notification-list-launcher-background-color':
    'secondary-button-background-color',
  'notification-list-launcher-background-color--hover':
    'secondary-button-background-color--hover',
  'notification-list-launcher-background-color--active':
    'secondary-button-background-color--active',
  'notification-list-launcher-background-color--disabled':
    'secondary-button-background-color--disabled',
  'notification-list-launcher-padding': { value: '6px 8px' },
  'notification-list-launcher-gap': 'space-3xs',
  'notification-list-launcher-icon-size': 'space-l',
  'notification-list-launcher-height': 'button-height-auto',
  'notification-list-launcher-border': 'button-border-none',
  'notification-list-launcher-offset': 'space-3xs',
  'notification-list-launcher-badge-background-color': 'color-notification',
  'notification-list-launcher-badge-text-color': 'color-base',

  // Notification List Launcher List
  'notification-list-launcher-list-z-index': { value: ZINDEX.popup.toString() },

  // Individual notification
  'notification-background-color': 'color-base',
  'notification-background-color--hover': 'color-base-strong',
  'notification-box-shadow': { value: 'none' },
  'notification-header-text-color': 'color-content-primary',
  'notification-header-emphasis-text-color': 'color-content-emphasis',
  'notification-content-text-color': 'color-content-primary',
  'notification-content-emphasis-text-color': 'color-content-emphasis',
  'notification-unread-background-color': 'color-notification',
  'notification-unread-background-color-opacity': { value: '0.04' },
  'notification-unread-background-color--hover':
    'notification-unread-background-color',
  'notification-unread-background-color-opacity--hover': { value: '0.06' },
  'notification-unread-badge-color': 'color-notification',
  'notification-unread-timestamp-text-color': 'color-notification',
  'notification-read-timestamp-text-color': 'color-content-secondary',
  'notification-border': { value: '1px none transparent' },
  'notification-border-radius': 'border-radius-medium',
  'notification-list-height': { value: 'auto' },
  'notification-list-width': { value: 'auto' },

  get 'inbox-border'() {
    return { value: `1px solid ${cssVar('color-base-x-strong')}` };
  },
  'inbox-border-radius': 'border-radius-medium',
  'inbox-height': { value: 'auto' },
  'inbox-width': { value: 'auto' },

  'button-height-auto': { value: 'auto' },
  'button-height-m': { value: '32px' },
  'button-border-none': { value: 'none' },
  get 'button-border'() {
    return { value: `1px solid ${cssVar('color-base-x-strong')}` };
  },
  'button-border-radius': 'border-radius-medium',
  get 'button-small-icon-only-padding'() {
    return { value: `${cssVar('space-3xs')} ${cssVar('space-2xs')}` };
  },
  get 'button-small-text-only-padding'() {
    return { value: `${cssVar('space-3xs')} ${cssVar('space-2xs')}` };
  },
  'button-small-icon-and-text-padding': 'space-3xs',
  get 'button-medium-icon-only-padding'() {
    return { value: addSpaceVars('4xs', '3xs') };
  },
  'button-medium-text-only-padding': 'space-2xs',
  get 'button-medium-icon-and-text-padding'() {
    return { value: `${addSpaceVars('4xs', '3xs')} ${cssVar('space-2xs')}` };
  },
  get 'button-large-icon-only-padding'() {
    return { value: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}` };
  },
  get 'button-large-text-only-padding'() {
    return { value: `${addSpaceVars('4xs', '2xs')}` };
  },
  get 'button-large-icon-and-text-padding'() {
    return { value: `${addSpaceVars('4xs', '2xs')} ${cssVar('space-2xs')}` };
  },
} as const;

export type CSSVariable = keyof typeof cssVariableFallbacks;

export function cordCssVarName(varName: CSSVariable): string {
  return `--cord-${varName}`;
}

// Ensure each fallback value is either CSSVariable type or { value: string }
// The next line complains if any fallbackValue does not conform
cssVariableFallbacks satisfies {
  [key: string]: CSSVariable | { value: string };
};

export function getCordCSSVariableDefaultValue(varName: CSSVariable): string {
  const value = cssVariableFallbacks[varName];
  if (typeof value === 'string') {
    return getCordCSSVariableDefaultValue(value);
  }
  return value.value;
}

export function getCordCSSVariableValue(
  varName: CSSVariable,
  element: Element | null,
): string {
  if (!element) {
    return getCordCSSVariableDefaultValue(varName);
  }
  const value =
    window
      .getComputedStyle(element)
      .getPropertyValue(cordCssVarName(varName)) ||
    getCordCSSVariableDefaultValue(varName);

  return value;
}

// finds "var(--cord-name," and puts "name" in the first match group
const varCordRegex = new RegExp(/var\(--cord-([^,]*),/);

// same as getCordCSSVariableDefaultValue(), but also resolves any nested
// var(--cord-*name*, ...) references.
// For example:
//  getCordCSSVariableDefaultValueDeep("shadow-small") returns:
//    0 2px 4px 0 rgba(0,0,0,0.08)
//  but getCordCSSVariableDefaultValue("shadow-small") returns:
//    0 var(--cord-space-4xs, 2px) var(--cord-space-3xs, 4px) 0 rgba(0,0,0,0.08)
export function getCordCSSVariableDefaultValueDeep(
  varName: CSSVariable,
): string {
  const value = cssVariableFallbacks[varName];
  if (typeof value === 'string') {
    return getCordCSSVariableDefaultValueDeep(value);
  }
  let newValue = '';
  let currValue = value.value;
  while (currValue.length > 0) {
    // Step 1: Find first occurrence of "var(--cord-name,"
    const match = currValue.match(varCordRegex);
    if (match == null) {
      // no CSS variable to replace
      newValue += currValue;
      currValue = '';
      break;
    }

    // Step 2: Everything before the match just gets copied over
    newValue += currValue.substring(0, match.index);

    // Step 3: Find the default value for the CSS variable we found
    newValue += getCordCSSVariableDefaultValueDeep(match[1] as CSSVariable);

    // Step 4: Find the closing bracket for the "var(" that was found
    let index = match.index! + 'var('.length; // index starts after the first paren
    let parens = 1;
    while (parens !== 0) {
      if (currValue[index] === '(') {
        parens++;
      } else if (currValue[index] === ')') {
        parens--;
      }
      index++;
    }

    // Step 5: Drop everything before the closing bracket of "var(...)"
    currValue = currValue.substring(index);
  }

  return newValue;
}

/* @__NO_SIDE_EFFECTS__ */
export function cssVar(varName: CSSVariable): string {
  const cachedValue = varCache[varName];
  if (cachedValue) {
    return cachedValue;
  }
  const fallback = cssVariableFallbacks[varName];
  const value = `var(--cord-${varName}, ${
    typeof fallback === 'object' ? fallback.value : cssVar(fallback)
  })`;
  varCache[varName] = value;
  return value;
}

/* @__NO_SIDE_EFFECTS__ */
export function cssVarWithOverride(
  varName: CSSVariable | undefined,
  override: CSSVariable | undefined,
) {
  if (override) {
    return cssVar(override);
  }
  if (varName) {
    return cssVar(varName);
  }
  return undefined;
}

/* @__NO_SIDE_EFFECTS__ */
export function cssValueWithOverride(
  value: string | undefined,
  override: CSSVariable | undefined,
) {
  if (value === undefined && override === undefined) {
    return undefined;
  }
  return override ? cssVar(override) : value;
}

export function addSpaceVars(...values: SpaceVar[]) {
  return `calc(${values.map((value) => cssVar(`space-${value}`)).join(' + ')})`;
}

export type WithCSSVariableOverrides<T, P> = T & {
  cssVariablesOverride?: Partial<P>;
};

export const spaceVars = [
  'none',
  '4xs',
  '3xs',
  '2xs',
  'xs',
  's',
  'm',
  'l',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  'auto',
] as const;
export type SpaceVar = (typeof spaceVars)[number];

export type ColorVar =
  | 'base'
  | 'base-strong'
  | 'base-x-strong'
  | 'content-primary'
  | 'content-secondary'
  | 'content-emphasis'
  | 'brand-primary'
  | 'notification'
  | 'alert'
  | 'success'
  | 'inherit';

export type ShadowVar = 'small' | 'large' | 'focus';
export type BorderRadiusVar = 'small' | 'medium' | 'large';

/**
 * Used for our 'all in one/out of the box' components e.g floating threads, or
 * anything with a launcher button, where we set reasonable defaults.
 */
export const CSS_VAR_CUSTOM_FALLBACKS = {
  // Used in floating-threads and selection-comments
  NESTED_THREAD: { width: '300px', maxHeight: '90vh' },
  NESTED_INBOX: { width: '400px', height: '600px' },
  NESTED_NOTIFICATION_LIST: { width: '400px', height: '60vh' },
} as const;

export function cssVarWithCustomFallback(
  varName: CSSVariable,
  fallBack: string, // TODO - link to CSS_VAR_CUSTOM_FALLBACKS
): string {
  return `var(--cord-${varName}, ${fallBack})`;
}

export function cssVarIfExistsOtherwiseFallback(
  varName: CSSVariable | undefined,
  fallback: string,
) {
  return varName ? cssVar(varName) : fallback;
}
