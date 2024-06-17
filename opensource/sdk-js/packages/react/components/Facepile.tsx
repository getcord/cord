import * as React from 'react';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.Facepile,
);

export type FacepileReactComponentProps = {
  users: string[];
  enableTooltip?: boolean;
};

export function Facepile(
  props: ReactPropsWithStandardHTMLAttributes<FacepileReactComponentProps>,
) {
  return (
    <cord-facepile
      id={props.id}
      class={props.className}
      style={props.style}
      {...propsToAttributes(props)}
    ></cord-facepile>
  );
}
