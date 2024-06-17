import { useMemo } from 'react';

// eslint-disable-next-line no-restricted-imports
import type { TFunction } from 'i18next';
import { useCordTranslation } from '@cord-sdk/react';
import {
  absoluteTimestampString,
  relativeTimestampString,
} from '@cord-sdk/react/common/util.ts';
import { WithTooltip2 } from 'external/src/components/ui2/WithTooltip2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { useTime } from '@cord-sdk/react/common/effects/useTime.tsx';

type Props = {
  isoDateString: string;
  relative: boolean;
  translationNamespace: 'message' | 'notifications';
  className?: string;
};

/**
 * @deprecated Use ui3/MessageTimestamp instead
 */
export function MessageTimestamp({
  isoDateString,
  relative,
  translationNamespace,
  className,
}: Props) {
  const { t: relativeT } = useCordTranslation(translationNamespace, {
    keyPrefix: 'timestamp',
  });
  const { t: absoluteT } = useCordTranslation(translationNamespace, {
    keyPrefix: 'absolute_timestamp',
  });
  const time = useTime();

  const date = useMemo(() => new Date(isoDateString), [isoDateString]);

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
    <WithTooltip2 label={absoluteTimestamp} nowrap={true}>
      <Text2
        color="content-secondary"
        font="small-light"
        noWrap={true}
        className={className}
      >
        {displayString}
      </Text2>
    </WithTooltip2>
  );
}
