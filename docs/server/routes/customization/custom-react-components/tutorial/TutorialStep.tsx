/** @jsxImportSource @emotion/react */

import { useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';
import cx from 'classnames';

export function TutorialStep({
  step,
  onInView,
  children,
  isActive,
  onClick,
}: {
  step: number;
  onInView: (step: number, isInView: boolean) => void;
  children: React.ReactNode;
  isActive?: boolean;
  onClick: (step: number) => void;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { amount: 'all' });

  useEffect(() => {
    onInView(step, isInView);
  }, [isInView, onInView, step]);

  return (
    <div
      onClick={() => {
        onClick(step);
      }}
      className={cx({ activeStep: isActive })}
      ref={ref}
      css={{ viewTransitionName: 'none' }}
    >
      {children}
    </div>
  );
}
