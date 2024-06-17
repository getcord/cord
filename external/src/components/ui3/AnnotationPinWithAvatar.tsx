import { useEffect, useRef } from 'react';
import cx from 'classnames';
import type { ClientUserData } from '@cord-sdk/types';
import { getCordCSSVariableValue } from 'common/ui/cssVariables.ts';
import { pinContainer } from '@cord-sdk/react/components/Pin.classnames.ts';
import { Avatar } from 'external/src/components/ui3/Avatar.tsx';
import { AnnotationPinIcon } from 'external/src/components/ui3/icons/AnnotationPinIcon.tsx';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { MODIFIERS } from 'common/ui/modifiers.ts';

function getPinSize(pinElement: SVGSVGElement | null) {
  return getCordCSSVariableValue('annotation-pin-size', pinElement);
}

export function AnnotationPinWithAvatar({
  annotationPlaced = true,
  unread,
  children,
  userData,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  annotationPlaced?: boolean;
  unread: boolean;
  children?: React.ReactNode;
  userData?: ClientUserData;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}) {
  const pinRef = useRef<SVGSVGElement | null>(null);
  const { setAnnotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  useEffect(() => {
    setAnnotationPinSize(getPinSize(pinRef.current));
  }, [setAnnotationPinSize]);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cx(pinContainer, { [MODIFIERS.unseen]: unread })}
    >
      {children}
      <AnnotationPinIcon forwardRef={pinRef} />
      {annotationPlaced && userData && <Avatar user={userData} size="3xl" />}
    </div>
  );
}
