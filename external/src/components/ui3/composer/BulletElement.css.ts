import { globalStyle } from 'common/ui/style.ts';

import { Sizes } from 'common/const/Sizes.ts';
import * as classes from 'external/src/components/ui3/composer/BulletElement.classnames.ts';
import { MAX_BULLET_INDENT } from '@cord-sdk/react/common/lib/messageNode.ts';
export const { container, listItem, orderedList, unorderedList } = classes;

globalStyle(`.${container}`, {
  paddingLeft: Sizes.BULLET_PADDING_LEFT,
  // adding the margin:0 allows us to copy and paste lists from Cord to
  // Slack without any spaces
  margin: 0,
});

function makeNestedStyles(className: string, styles: string[]) {
  for (let i = 0; i <= MAX_BULLET_INDENT; i++) {
    // This produces a selector for a container nested within i other containers
    const nestedContainers = `.${container}.${className} `.repeat(i);
    globalStyle(`:where(${nestedContainers}.${container}).${className}`, {
      listStyleType: styles[i % styles.length],
    });
  }
}

makeNestedStyles(unorderedList, ['disc', 'circle', 'square']);
makeNestedStyles(orderedList, ['decimal', 'lower-alpha', 'lower-roman']);
