/** @jsxImportSource @emotion/react */
import * as Tooltip from '@radix-ui/react-tooltip';

type WithTooltipProps = {
  label: string;
  disabled?: boolean;
};
// Tooltip provider is at App level
/**
 * Wrap the contents with this if you want a tool tip to be triggered on hover
 */
const WithTooltip = ({
  label,
  disabled,
  children,
}: React.PropsWithChildren<WithTooltipProps>) => {
  return (
    <Tooltip.Root disableHoverableContent={disabled}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={4}
          align="center"
          className="TooltipContent"
          css={{
            fontSize: 12,
            padding: '4px 8px',
            backgroundColor: 'var(--color-greyXdark)',
            color: 'var(--color-base)',
            borderRadius: 2,
            boxShadow: 'var(--box-shadow-small)',
            margin: 0,
            zIndex: 1000, // To be infront of every other element
            maxWidth: 200,
            width: 'min-content',
            minWidth: 120,
          }}
        >
          {label}
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};
export default WithTooltip;
