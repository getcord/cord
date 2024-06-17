import { MessageTimestamp } from 'external/src/components/ui3/MessageTimestamp.tsx';
import type { TimestampReactComponentProps } from '@cord-sdk/react';

export function Timestamp({
  value = new Date(),
  relative = true,
}: TimestampReactComponentProps) {
  return (
    <MessageTimestamp
      value={value}
      relative={relative}
      translationNamespace="message"
    />
  );
}
