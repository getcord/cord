import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import type { Text2Props } from 'external/src/components/ui2/Text2.tsx';

type Props = Text2Props<'label'>;

export const Label2 = (props: React.PropsWithChildren<Props>) => {
  return (
    <Text2 {...props} as="label">
      {props.children}
    </Text2>
  );
};
