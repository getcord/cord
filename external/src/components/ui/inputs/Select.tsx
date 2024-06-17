import { useRef, useState, useEffect } from 'react';
import { createUseStyles } from 'react-jss';

import { ResizeObserverContext } from 'external/src/context/resizeObserver/ResizeObserverContext.ts';
import { DownArrowIcon } from 'external/src/components/ui/icons/DownArrow.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import type { Color } from 'common/const/Colors.ts';
import { Colors } from 'common/const/Colors.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

const ARROW_SIZE = 8;

const useStyles = createUseStyles({
  selectMenu: {
    appearance: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    minWidth: '0px',
    outline: 0,
    '-moz-appearance': 'none',
    '&:focus-visible': {
      outline: 0,
    },
  },
  arrowWrapper: {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    pointerEvents: 'none',
    position: 'absolute',
    right: Sizes.XSMALL,
    top: 0,
  },
});

type Option = {
  value: string;
  label: string;
};

type Props = {
  name?: string;
  value: string | undefined;
  options: Option[];
  onSelect: (value: string) => void;
  fontColor?: Color;
};
export function Select({
  name,
  value,
  options,
  onSelect,
  fontColor = 'GREY_X_DARK',
}: Props) {
  const classes = useStyles();
  // We set the select's width equal to its selected option. To do this we
  // observe the width of a hidden select containing just the selected option
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);
  const [selectWidth, setSelectWidth] = useState<number>();
  const { observeElement, unobserveElement } = useContextThrowingIfNoProvider(
    ResizeObserverContext,
  );
  useEffect(() => {
    const hiddenSelect = hiddenSelectRef.current;
    if (!hiddenSelect) {
      return;
    }
    observeElement(hiddenSelect, (entry) => {
      setSelectWidth(entry.contentRect.width);
    });
    return () => unobserveElement(hiddenSelect);
  }, [observeElement, unobserveElement]);

  if (!options.length) {
    return null;
  }
  const selectedLabel = (
    options.find((option) => option.value === value) ?? options[0]
  ).label;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <select
          name={name}
          className={classes.selectMenu}
          value={value}
          style={{
            color: Colors[fontColor],
            width: selectWidth
              ? selectWidth + ARROW_SIZE + Sizes.SMALL
              : undefined,
          }}
          onChange={(event) => onSelect(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={classes.arrowWrapper}>
          <DownArrowIcon size={ARROW_SIZE} color={fontColor} />
        </div>
      </div>
      {/* For measuring width of selected option */}
      <select
        ref={hiddenSelectRef}
        style={{ position: 'fixed', visibility: 'hidden' }}
        className={classes.selectMenu}
      >
        <option value={value}>{selectedLabel}</option>
      </select>
    </>
  );
}
