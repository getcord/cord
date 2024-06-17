import * as React from 'react';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type {
  MessageAttachment,
  MessageContent as MessageContentType,
} from '@cord-sdk/types';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.MessageContent,
);

export type MessageContentReactComponentProps = {
  content?: MessageContentType | null | undefined;
  attachments?: MessageAttachment[];
  edited?: boolean;
};

export function MessageContent(
  props: ReactPropsWithStandardHTMLAttributes<MessageContentReactComponentProps>,
) {
  return (
    <cord-message-content
      id={props.id}
      class={props.className}
      style={props.style}
      {...propsToAttributes(props)}
    ></cord-message-content>
  );
}
