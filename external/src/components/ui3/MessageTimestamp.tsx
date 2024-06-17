import { useMemo } from 'react';
import cx from 'classnames';

// eslint-disable-next-line no-restricted-imports
import type { TFunction } from 'i18next';
import { useCordTranslation } from '@cord-sdk/react';
import {
  absoluteTimestampString,
  relativeTimestampString,
} from '@cord-sdk/react/common/util.ts';
import { WithTooltip } from 'external/src/components/ui3/WithTooltip.tsx';
import { fontSmallLight } from 'common/ui/atomicClasses/fonts.css.ts';
import { timestamp } from 'external/src/components/ui3/MessageTimestamp.css.ts';
import { useTime } from '@cord-sdk/react/common/effects/useTime.tsx';

type Props = {
  // the string value is a date string with the format YYYY-MM-DDTHH:mm:ss.sssZ
  value: string | number | Date;
  relative: boolean;
  translationNamespace: 'message' | 'notifications';
  className?: string;
};

export function MessageTimestamp({
  value,
  relative,
  translationNamespace,
}: Props) {
  const { t: relativeT } = useCordTranslation(translationNamespace, {
    keyPrefix: 'timestamp',
  });
  const { t: absoluteT } = useCordTranslation(translationNamespace, {
    keyPrefix: 'absolute_timestamp',
  });
  const time = useTime();

  const date = useMemo(() => new Date(value), [value]);

  const absoluteTimestamp = useMemo(
    () => absoluteT('tooltip', { date }),
    [date, absoluteT],
  );

  const displayString = useMemo(
    () =>
      relative
        ? relativeTimestampString(date, time, relativeT)
        : absoluteTimestampString(
            date,
            time,
            absoluteT as TFunction<'message', 'absolute_timestamp'>,
          ),
    [date, time, relative, relativeT, absoluteT],
  );

  return (
    <WithTooltip label={absoluteTimestamp}>
      <p className={cx(fontSmallLight, timestamp)}>{displayString}</p>
    </WithTooltip>
  );
}
