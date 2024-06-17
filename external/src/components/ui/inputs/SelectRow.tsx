import { useEffect } from 'react';

import type { Select } from 'external/src/components/ui/inputs/Select.tsx';
import { useLogger } from 'external/src/logging/useLogger.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { CustomSelect2 } from 'external/src/components/ui2/inputs/CustomSelect2.tsx';

type Props = React.ComponentProps<typeof Select> & {
  label: string;
};

export function SelectRow({ label, ...otherProps }: Props) {
  const { logWarning } = useLogger();
  useEffect(() => {
    // We had an error where options was empty. This log should identify where
    // it happens if/when it happens again
    // https://admin.cord.com/errors/14fb1dbc-3792-4085-b7e4-dfd89e879c82
    if (!otherProps.options.length) {
      logWarning('select-row-no-options', {
        label,
        value: otherProps.value,
        name: otherProps.name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!otherProps.options.length) {
    return null;
  }

  return (
    <Row2>
      <Text2 color="content-primary">{label}</Text2>
      <CustomSelect2 {...otherProps} />
    </Row2>
  );
}
