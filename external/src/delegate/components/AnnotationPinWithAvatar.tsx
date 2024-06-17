import { useEffect, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import type { ClientUserData } from '@cord-sdk/types';
import { cssVar, getCordCSSVariableValue } from 'common/ui/cssVariables.ts';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Avatar2 } from 'external/src/components/ui2/Avatar2.tsx';
import { AnnotationPin2 } from 'external/src/components/ui2/icons/customIcons/AnnotationPinSvg.tsx';
import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const useStyles = createUseStyles({
  annotationPinWithAvatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    transformOrigin: 'bottom left',
  },
  annotationPinAvatarContainer: {
    '--cord-avatar-border-radius': '50%',
    position: 'absolute',
  },

  // we pass this to the avatar to override the existing
  //  properties if we have a pin size variable
  avatarSize: {
    height: `calc(${cssVar('annotation-pin-size')} * 0.8)`,
    width: `calc(${cssVar('annotation-pin-size')} * 0.8)`,
    '& p': {
      fontSize: `calc(${cssVar('annotation-pin-size')} * 0.8 * 0.5 )`,
    },
  },
});

function getPinSize(pinElement: SVGSVGElement | null) {
  return getCordCSSVariableValue('annotation-pin-size', pinElement);
}

/**
 * @deprecated Use ui3/AnnotationPinWithAvatar instead
 */
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
  const classes = useStyles();
  const pinRef = useRef<SVGSVGElement | null>(null);

  const { setAnnotationPinSize } = useContextThrowingIfNoProvider(
    PinnedAnnotationsContext,
  );

  useEffect(() => {
    setAnnotationPinSize(getPinSize(pinRef.current));
  }, [setAnnotationPinSize]);

  let pinColour;
  let strokeColour;
  const pinSize = cssVar('annotation-pin-size');

  if (annotationPlaced) {
    if (unread) {
      pinColour = cssVar('annotation-pin-unread-color');
      strokeColour = cssVar('annotation-pin-unread-outline-color');
    } else {
      pinColour = cssVar('annotation-pin-read-color');
      strokeColour = cssVar('annotation-pin-read-outline-color');
    }
  } else {
    pinColour = cssVar('annotation-pin-unplaced-color');
    strokeColour = cssVar('annotation-pin-unplaced-outline-color');
  }

  return (
    <Row2
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={classes.annotationPinWithAvatarContainer}
    >
      {children}
      <AnnotationPin2
        width={pinSize}
        fillColour={pinColour}
        outlineColour={strokeColour}
        forwardRef={pinRef}
      />
      {annotationPlaced && userData && (
        <div className={classes.annotationPinAvatarContainer}>
          <Avatar2
            user={userData}
            additionalClassName={classes.avatarSize}
            size="3xl"
          />
        </div>
      )}
    </Row2>
  );
}
