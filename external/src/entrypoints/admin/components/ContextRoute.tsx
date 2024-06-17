import { useMemo } from 'react';

import { useCordLocation } from '@cord-sdk/react';

import type { Location } from 'common/types/index.ts';
import { useUnsafeParams } from 'external/src/effects/useUnsafeParams.ts';

type CordContextSetterProps<Params> = React.PropsWithChildren<{
  context: Location | ((params: Params) => Location);
}>;
export function CordContextSetter<
  Params extends { [K in keyof Params]?: string },
>({ context, children }: CordContextSetterProps<Params>) {
  const params = useUnsafeParams<Params>();
  const destContext = useMemo(
    () => (typeof context === 'object' ? context : context(params)),
    [context, params],
  );
  useCordLocation(destContext);

  return <>{children}</>;
}
