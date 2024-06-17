const Breakpoints = {
  MEDIUM: 901,
  LARGE: 1281,
};

export const MediaQuery = {
  SMALL: `@media (max-width: ${Breakpoints.MEDIUM - 1}px)`,
  MEDIUM: `@media (min-width: ${Breakpoints.MEDIUM}px) and (max-width: ${
    Breakpoints.LARGE - 1
  }px)`,
  LARGE: `@media (min-width: ${Breakpoints.LARGE}px)`,
  FROM_MEDIUM: `@media (min-width: ${Breakpoints.MEDIUM}px)`,
};
