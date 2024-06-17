import * as React from 'react';

import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.Reactions,
);

export type ReactionsReactComponentProps = {
  threadId?: string;
  messageId?: string;
  showAddReactionButton?: boolean;
  showReactionList?: boolean;
};

export function Reactions(
  props: ReactPropsWithStandardHTMLAttributes<ReactionsReactComponentProps>,
) {
  return (
    <cord-reactions
      id={props.id}
      class={props.className}
      style={props.style}
      {...propsToAttributes(props)}
    ></cord-reactions>
  );
}
