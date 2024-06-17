export type PositionProps = {
  position?: 'relative' | 'absolute' | 'fixed';
};

export const getPositionStyles = ({ position }: PositionProps) => ({
  position,
});
