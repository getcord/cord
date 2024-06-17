import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';

type Props = {
  unshownUserCount: number;
};

export function UnshownUserCountText({ unshownUserCount }: Props) {
  return (
    <MenuItem2
      disabled={true}
      leftItem={
        <Text2 color="content-secondary" font="small">
          {unshownUserCount > 0 && `+${unshownUserCount} more`}
        </Text2>
      }
      label=""
    />
  );
}
