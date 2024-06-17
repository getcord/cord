import type { Location } from 'common/types/index.ts';
import { isLocation } from 'common/types/index.ts';
import { PageContext } from 'external/src/context/page/PageContext.ts';
import { useCordLocation } from 'sdk/client/core/react/useCordLocation.tsx';

type Props = React.PropsWithChildren<{
  location?: Location;
}>;

export function ComponentPageContextProvider(props: Props) {
  const location = useCordLocation(props.location);
  if (!isLocation(location)) {
    throw new Error('Invalid location');
  }
  return (
    <PageContext.Provider value={{ data: location, providerID: null }}>
      {props.children}
    </PageContext.Provider>
  );
}
