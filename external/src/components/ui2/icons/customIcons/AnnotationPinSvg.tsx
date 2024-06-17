import { cssVar } from 'common/ui/cssVariables.ts';
import { cordifyClassname } from 'common/ui/style.ts';

// This svg is slightly different to the usual suite of icons - it is used as the
// actual annotation marker on the page rather than a standard design system icon
// used e.g. for a button.  For this reason, the component is used directly rather
// than via the Icon2 wrapper.
/**
 * @deprecated please use ui3/AnnotationPinIcon
 */
export function AnnotationPin2({
  width,
  fillColour,
  outlineColour,
  forwardRef,
  ...props
}: JSX.IntrinsicElements['svg'] & {
  width: string | number;
  fillColour: string; // Really, one of our css variables, or in the native screenshotter, a
  outlineColour: string; // css variable wrapped in encodeURIComponent
  forwardRef?: React.RefObject<SVGSVGElement>;
}) {
  return (
    <svg
      viewBox="0 0 34 34"
      fill="none"
      className={cordifyClassname('annotation-pin')}
      style={{
        width,
        filter: cssVar('annotation-pin-filter'),
        ...props.style,
      }}
      xmlns="http://www.w3.org/2000/svg"
      ref={forwardRef}
    >
      <path
        d="M1 17C1 8.16344 8.16344 1 17 1V1C25.8366 1 33 8.16344 33 17V17C33 25.8366 25.8366 33 17 33H2.88235C1.84276 33 1 32.1572 1 31.1176V17Z"
        fill={fillColour}
      />
      <path
        d="M2.88235 33.5H17C26.1127 33.5 33.5 26.1127 33.5 17C33.5 7.8873 26.1127 0.5 17 0.5C7.8873 0.5 0.5 7.8873 0.5 17V31.1176C0.5 32.4334 1.56662 33.5 2.88235 33.5Z"
        stroke={outlineColour}
        strokeOpacity={1}
      />
    </svg>
  );
}
