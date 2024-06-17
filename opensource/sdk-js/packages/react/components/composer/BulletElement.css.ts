import { Sizes } from '../../common/const/Sizes.js';
import { globalStyle } from '../../common/ui/style.js';
import { MAX_BULLET_INDENT } from '../../common/lib/messageNode.js';

import * as classes from '../../components/composer/BulletElement.classnames.js';
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
