import { Truncator2 } from 'external/src/components/2/Truncator2.tsx';
import { Sizes } from 'common/const/Sizes.ts';

export function MessageTruncator2({
  children,
  expandable,
  highlighted = false,
}: React.PropsWithChildren<{ highlighted?: boolean; expandable: boolean }>) {
  return (
    <Truncator2
      truncateAtPx={Sizes.MESSAGE_HEIGHT_TRUNCATE_AT_PX}
      truncateToPx={Sizes.MESSAGE_HEIGHT_TRUNCATE_TO_PX}
      expandable={expandable}
      highlighted={highlighted}
    >
      {children}
    </Truncator2>
  );
}
