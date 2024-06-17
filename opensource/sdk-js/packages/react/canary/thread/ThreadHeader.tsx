import * as React from 'react';
import { forwardRef } from 'react';
import cx from 'classnames';

import withCord from '../../experimental/components/hoc/withCord.js';
import * as buttonClasses from '../../components/helpers/Button.classnames.js';
import { Button, OptionsMenu } from '../../betaV2.js';
import type { StyleProps } from '../../betaV2.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import classes from './Thread.css.js';

export type ThreadHeaderProps = {
  showContextMenu?: boolean;
  threadID: string | undefined;
  hidden?: boolean;
} & StyleProps &
  MandatoryReplaceableProps;

export const ThreadHeader = withCord<
  React.PropsWithChildren<ThreadHeaderProps>
>(
  forwardRef(function ThreadHeader(
    {
      threadID,
      showContextMenu = true,
      hidden = true,
      className,
      ...restProps
    }: ThreadHeaderProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    if (hidden) {
      return null;
    }

    return (
      <div
        {...restProps}
        ref={ref}
        className={cx(className, classes.threadHeader)}
      >
        {showContextMenu && threadID && (
          <OptionsMenu
            button={
              <Button
                canBeReplaced
                buttonAction="show-thread-options"
                icon="DotsThree"
                className={cx(
                  buttonClasses.colorsSecondary,
                  buttonClasses.small,
                )}
              ></Button>
            }
            threadID={threadID}
            showThreadOptions={true}
            showMessageOptions={false}
            canBeReplaced
            setEditing={() => {}}
          />
        )}
        <Button
          canBeReplaced
          buttonAction="close-thread"
          icon="X"
          className={cx(buttonClasses.colorsSecondary, buttonClasses.small)}
        />
      </div>
    );
  }),
  'ThreadHeader',
);
