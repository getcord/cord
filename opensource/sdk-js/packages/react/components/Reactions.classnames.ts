import { MODIFIERS } from '../common/ui/modifiers.js';
import { cordifyClassname } from '../common/cordifyClassname.js';

export const reactionsContainer = cordifyClassname('reactions-container');
export const reactionList = cordifyClassname('reaction-list');
export const addReaction = cordifyClassname('add-reaction');
export const pill = cordifyClassname('pill');
export const emoji = cordifyClassname('emoji');
export const count = cordifyClassname('count');

export const reactionsClassnamesDocs = {
  [reactionsContainer]:
    'Applied to the container div. This class is always present.',
  [reactionList]:
    'Applied to the div containing reactions and the add reaction button.',
  [addReaction]: 'Applied to the add reaction button element',
  [pill]:
    'Applied to the div element containing the emoji unicode and the number of reactions.',
  [MODIFIERS.fromViewer]:
    'Applied to the reaction pill that contains a reaction that the viewer has already reacted with.',
  [emoji]: 'Applied to the span element containing the emoji unicode.',
  [count]: 'Applied to the p element containing the number of reactions.',
};
