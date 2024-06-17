import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import cx from 'classnames';

import { Colors } from 'common/const/Colors.ts';
import { Styles } from 'common/const/Styles.ts';
import { Portal } from 'external/src/components/Portal.tsx';
import { SCREENSHOT_TRANSITION_IN_MS } from 'common/const/Timing.ts';
import { ZINDEX } from 'common/ui/zIndex.ts';
import { SIDEBAR_OVERLAY_ID } from 'common/const/ElementIDs.ts';
import type { CSSVariable } from 'common/ui/cssVariables.ts';
import { cssVar } from 'common/ui/cssVariables.ts';

type BackgroundColor = 'transparent' | 'dark' | 'darker';

const useStyles = createUseStyles({
  overlay: (top: CSSVariable | undefined) => ({
    bottom: 0,
    left: 0,
    position: 'fixed',
    top: top ? cssVar(top) : 0,
    transition: `background ${SCREENSHOT_TRANSITION_IN_MS}ms, opacity ${SCREENSHOT_TRANSITION_IN_MS}ms`,
  }),
  overlayPopupLayer: {
    zIndex: ZINDEX.popup,
  },
  overlayModalLayer: {
    zIndex: ZINDEX.modal,
  },
  overlayAnnotationLayer: {
    zIndex: cssVar('annotation-pin-z-index'),
  },
  overlayNotFullWidth: {
    right: cssVar('sidebar-width'),
  },
  overlayFullWidth: {
    right: 0,
  },
  overlayOverSidebar: {
    bottom: 0,
    position: 'fixed',
    right: 0,
    top: cssVar('sidebar-top'),
    width: cssVar('sidebar-width'),
    zIndex: ZINDEX.popup,
  },
  appeared: {
    opacity: 1,
  },
  disappeared: {
    opacity: 0,
  },
  blurredBackground: {
    backdropFilter: 'blur(3px)',
  },
  disallowPointerEvents: {
    pointerEvents: 'none',
  },
  transparentBackground: { backgroundColor: Colors.TRANSPARENT },
  darkBackground: { backgroundColor: Styles.MODAL_BACKGROUND_COLOR_LIGHT },
  darkerBackground: { backgroundColor: Styles.MODAL_BACKGROUND_COLOR_DARK },
});

type Props = {
  allowPointerEvents?: boolean;
  backgroundColor?: BackgroundColor;
  blurredBackground?: boolean;
  className?: string;
  fadeIn?: boolean;
  includeOnClickOnSidebar?: boolean;
  zIndexLayer?: 'popup' | 'modal' | 'annotation';
  onClick?: () => void;
  sidebarBackgroundColor?: BackgroundColor;
  withoutSidebar?: boolean;
  fullWidth?: boolean;
  forwardRef?: React.RefObject<HTMLDivElement>;
  top?: CSSVariable;
};

export function Overlay({
  allowPointerEvents = true,
  backgroundColor = 'transparent',
  blurredBackground,
  children,
  className,
  fadeIn,
  includeOnClickOnSidebar = true,
  top,
  onClick,
  sidebarBackgroundColor = 'transparent',
  withoutSidebar,
  fullWidth,
  forwardRef,
  zIndexLayer = 'popup',
}: React.PropsWithChildren<Props>) {
  const [appeared, setAppeared] = useState(!fadeIn);

  const classes = useStyles(top);

  // Annoyingly this setTimeout seems necessary for the CSS transition on mount to kick in
  useEffect(() => {
    setTimeout(() => {
      setAppeared(true);
    }, 0);
  }, []);

  const overlayClassName = cx(
    classes.overlay,
    {
      [classes.overlayFullWidth]: fullWidth,
      [classes.overlayNotFullWidth]: !fullWidth,
      [classes.overlayAnnotationLayer]: zIndexLayer === 'annotation',
      [classes.overlayPopupLayer]: zIndexLayer === 'popup',
      [classes.overlayModalLayer]: zIndexLayer === 'modal',
      [classes.blurredBackground]: blurredBackground,
      [classes.appeared]: appeared,
      [classes.disappeared]: !appeared,
      [classes.disallowPointerEvents]: !allowPointerEvents,

      [classes.transparentBackground]: backgroundColor === 'transparent',
      [classes.darkBackground]: backgroundColor === 'dark',
      [classes.darkerBackground]: backgroundColor === 'darker',
    },
    className,
  );

  const sidebarOverlayClassName = cx({
    [classes.overlayOverSidebar]: !fullWidth && !withoutSidebar,
    [classes.appeared]: appeared,
    [classes.disappeared]: !appeared,

    [classes.transparentBackground]: sidebarBackgroundColor === 'transparent',
    [classes.darkBackground]: sidebarBackgroundColor === 'dark',
    [classes.darkerBackground]: sidebarBackgroundColor === 'darker',
  });

  return (
    <Portal>
      <div className={overlayClassName} onClick={onClick} ref={forwardRef}>
        {children}
      </div>
      {!withoutSidebar && (
        <div
          className={sidebarOverlayClassName}
          id={SIDEBAR_OVERLAY_ID}
          onClick={includeOnClickOnSidebar ? onClick : undefined}
        />
      )}
    </Portal>
  );
}
