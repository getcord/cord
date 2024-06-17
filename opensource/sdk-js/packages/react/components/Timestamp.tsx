import * as React from 'react';
import {
  componentAttributes,
  propsToAttributeConverter,
} from '@cord-sdk/components';
import type { ReactPropsWithStandardHTMLAttributes } from '../types.js';

const propsToAttributes = propsToAttributeConverter(
  componentAttributes.Timestamp,
);

export type TimestampReactComponentProps = {
  value?: string | number | Date;
  relative?: boolean;
};

export function Timestamp(
  props: ReactPropsWithStandardHTMLAttributes<TimestampReactComponentProps>,
) {
  let value = props.value;

  if (typeof value === 'number') {
    value = new Date(value).toISOString();
  }

  if (typeof value === 'object') {
    // Need to guard against passing in non Date objects
    // and also invalid Date objects
    // i.e value={{}} and value={new Date({})}
    const dateObj = new Date(value);

    // Calling .getTime() on an invalid Date objects
    // will return NaN
    if (!isNaN(dateObj.getTime())) {
      value = dateObj.toISOString();
    } else {
      // set to empty string to explicity show Invalid Date
      value = '';
    }
  }

  return (
    <cord-timestamp
      {...propsToAttributes(props)}
      id={props.id}
      class={props.className}
      style={props.style}
      value={value}
    ></cord-timestamp>
  );
}
