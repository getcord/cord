import * as classes from 'external/src/components/ui3/icons/AnnotationPinIcon.css.ts';

export function AnnotationPinIcon({
  forwardRef,
  ...props
}: JSX.IntrinsicElements['svg'] & {
  forwardRef?: React.RefObject<SVGSVGElement>;
}) {
  return (
    <svg
      viewBox="0 0 34 34"
      fill="none"
      className={classes.annotationPin}
      style={props.style}
      xmlns="http://www.w3.org/2000/svg"
      ref={forwardRef}
    >
      <path d="M1 17C1 8.16344 8.16344 1 17 1V1C25.8366 1 33 8.16344 33 17V17C33 25.8366 25.8366 33 17 33H2.88235C1.84276 33 1 32.1572 1 31.1176V17Z" />
    </svg>
  );
}
