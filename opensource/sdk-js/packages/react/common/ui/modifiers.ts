import { cordifyClassname } from '../cordifyClassname.js';

export const MODIFIERS = {
  active: cordifyClassname('active'),
  badged: cordifyClassname('badged'),
  loading: cordifyClassname('loading'),
  disabled: cordifyClassname('disabled'),
  notPresent: cordifyClassname('not-present'),
  present: cordifyClassname('present'),
  noReactions: cordifyClassname('no-reactions'),
  noReplies: cordifyClassname('no-replies'),
  deleted: cordifyClassname('deleted'),
  action: cordifyClassname('action'),
  unseen: cordifyClassname('unseen'),
  editing: cordifyClassname('editing'),
  selected: cordifyClassname('selected'),
  subscribed: cordifyClassname('subscribed'),
  highlighted: cordifyClassname('highlighted'),
  error: cordifyClassname('error'),
  hidden: cordifyClassname('hidden'),
  resolved: cordifyClassname('resolved'),
  open: cordifyClassname('open'),
  expanded: cordifyClassname('expanded'),
  collapsed: cordifyClassname('collapsed'),

  extraLarge: cordifyClassname('extra-large'),
  large: cordifyClassname('large'),
  medium: cordifyClassname('medium'),

  fromViewer: cordifyClassname('from-viewer'),
};

/**
 * Applies one or more `modifier` class to the `selector`.
 * The CSS specificity is the one of `selector`, as we remove
 * the modifier specificity using `:where()`.
 */
export function getModifiedSelector(
  modifiers: keyof typeof MODIFIERS | Array<keyof typeof MODIFIERS>,
  selector: string,
) {
  const modifiersToApply = Array.isArray(modifiers)
    ? `.${modifiers.map((modifier) => MODIFIERS[modifier]).join('.')}`
    : `.${MODIFIERS[modifiers]}`;
  return `:where(${modifiersToApply})${selector}`;
}
