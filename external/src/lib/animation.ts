export const getShakeKeyframes = ({
  shakes,
  distance,
}: {
  shakes: number;
  distance: number;
}) => {
  const keyframes = [];
  for (let i = 0; i < shakes; i++) {
    keyframes.push(...[-distance, distance]);
  }
  return keyframes;
};
