import * as React from 'react';
import { forwardRef, useMemo } from 'react';

import withCord from '../../experimental/components/hoc/withCord.js';
import type { MandatoryReplaceableProps } from '../../experimental/components/replacements.js';
import type { NamedElements, StyleProps } from '../../experimental/types.js';
import type { ToolbarLayoutWithClassName } from './ToolbarLayout.js';
import { WithDragAndDrop } from './WithDragAndDrop.js';

export type ComposerLayoutProps = {
  /**
   * Where your user inputs the text.
   */
  textEditor: JSX.Element;
  /**
   * An array of named elements that would appear in the toolbar.
   * You can filter some out, or reorder, or add new custom buttons.
   *
   * They are usually passed into `props.ToolbarLayoutComp`.
   */
  toolbarItems?: NamedElements;
  /**
   * An array of named elements that would appear in the composer.
   * By default it contains the file attachments.
   */
  extraChildren?: NamedElements;
  /**
   * If the composer is empty.
   * An empty composer will show a placeholder.
   */
  isEmpty: boolean;
  /**
   * If the composer is valid, this will enable or disable the send button.
   */
  isValid: boolean;
  /**
   * The toolbar layout component, we pass `toolbarItems` to it.
   * It is here mostly for your convenience so you do not need to import it.
   */
  ToolbarLayoutComp: typeof ToolbarLayoutWithClassName;
  /**
   * A function that can be used to upload, and attach files to the composer
   * without using the add attachment button. This is useful, for example,
   * if you wanted to create your own gif integration.
   */
  attachFilesToComposer: (files: File[]) => Promise<void>;
  /**
   * Allows attachments to be added by dragging and dropping within the
   * composer area. Defaults to true.
   */
  enableDragDropAttachments: boolean;
} & StyleProps &
  MandatoryReplaceableProps;
export const ComposerLayout = withCord<
  React.PropsWithChildren<ComposerLayoutProps>
>(
  forwardRef(function ComposerLayout(
    props: ComposerLayoutProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      toolbarItems,
      extraChildren,
      ToolbarLayoutComp,
      attachFilesToComposer,
      enableDragDropAttachments = true,
    } = props;
    const attachments = useMemo(
      () => extraChildren?.find((item) => item.name === 'attachments')?.element,
      [extraChildren],
    );

    const failedToSubmitMessage = useMemo(
      () =>
        extraChildren?.find((item) => item.name === 'failSubmitMessage')
          ?.element,
      [extraChildren],
    );

    const extra = useMemo(
      () =>
        extraChildren
          ?.filter(
            (item) =>
              item.name !== 'attachments' && item.name !== 'failSubmitMessage',
          )
          .map((item) => item.element),
      [extraChildren],
    );

    return (
      <>
        {failedToSubmitMessage}
        <WithDragAndDrop
          ref={ref}
          style={props.style}
          className={props.className}
          data-cord-replace={props['data-cord-replace']}
          attachFilesToComposer={attachFilesToComposer}
          enableDragDropAttachments={enableDragDropAttachments}
        >
          {props.textEditor}
          {attachments}
          <ToolbarLayoutComp items={toolbarItems} />
          {extra}
        </WithDragAndDrop>
      </>
    );
  }),
  'ComposerLayout',
);
