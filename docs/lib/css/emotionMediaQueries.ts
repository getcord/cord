function makeBreakpoint(pixels: number): string {
  return `@media (max-width: ${pixels}px)`;
}
const emotionMediaQueries = {
  mobile: makeBreakpoint(576),
  tablet: makeBreakpoint(768),
  desktop: makeBreakpoint(1200),
  wide: makeBreakpoint(1800),
};

export default emotionMediaQueries;
