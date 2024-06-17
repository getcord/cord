import { cordifyClassname, globalStyle } from 'common/ui/style.ts';
import { cssVar } from 'common/ui/cssVariables.ts';
import { getModifiedSelector } from 'common/ui/modifiers.ts';
import { pinContainer } from '@cord-sdk/react/components/Pin.classnames.ts';

export const annotationPin = cordifyClassname('annotation-pin');

globalStyle(`.${annotationPin}`, {
  fill: cssVar('annotation-pin-read-color'),
  filter: cssVar('annotation-pin-filter'),
  stroke: cssVar('annotation-pin-read-outline-color'),
  width: cssVar('annotation-pin-size'),
});

globalStyle(
  `.${cordifyClassname('unplaced-annotation-pin')} .${annotationPin}`,
  {
    fill: cssVar('annotation-pin-unplaced-color'),
    stroke: cssVar('annotation-pin-unplaced-outline-color'),
  },
);

globalStyle(
  `${getModifiedSelector('unseen', `.${pinContainer}`)} .${annotationPin}`,
  {
    fill: cssVar('annotation-pin-unread-color'),
    stroke: cssVar('annotation-pin-unread-outline-color'),
  },
);
