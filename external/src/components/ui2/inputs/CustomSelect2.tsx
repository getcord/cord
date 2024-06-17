import { useMemo, useState, useCallback, useEffect } from 'react';
import { createUseStyles } from 'react-jss';
import { Menu2 } from 'external/src/components/ui2/Menu2.tsx';
import { MenuItem2 } from 'external/src/components/ui2/MenuItem2.tsx';
import { BoxWithPopper2 } from 'external/src/components/ui2/BoxWithPopper2.tsx';
import { Keys } from '@cord-sdk/react/common/const/Keys.ts';
import { Box2 } from 'external/src/components/ui2/Box2.tsx';
import { Text2 } from 'external/src/components/ui2/Text2.tsx';
import { Icon2 } from 'external/src/components/ui2/icons/Icon2.tsx';
import { Row2 } from 'external/src/components/ui2/Row2.tsx';

const ROW_HEIGHT = 40;

const useStyles = createUseStyles({
  // the popper will be located in relation to the content of this
  // container and its children
  select: {
    display: 'inline-block',
    overflow: 'hidden',
    cursor: 'pointer',
    flex: 1,
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
};

export function CustomSelect2({ value, options, onSelect }: Props) {
  const classes = useStyles();

  const [showDropDownMenu, setShowDropDownMenu] = useState<boolean>(false);

  const optionsValueLabelObject = useMemo(() => {
    const optionsByValueObject: { [value: string]: string } = {};
    if (options) {
      options.forEach(
        (option) => (optionsByValueObject[option.value] = option.label),
      );
    }
    return optionsByValueObject;
  }, [options]);

  const definedValue =
    value && value in optionsValueLabelObject ? value : options[0].value;

  const [selectedIndexAndValue, setSelectedIndexAndValue] = useState<{
    index: number;
    value: string;
  }>({
    index: options.findIndex((option) => option.value === definedValue),
    value: definedValue,
  });

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case Keys.ARROW_DOWN: {
          event.preventDefault();
          const changeIndex =
            selectedIndexAndValue.index + 1 <= options.length - 1;
          if (changeIndex) {
            setSelectedIndexAndValue((prev) => ({
              index: prev.index + 1,
              value: options[prev.index + 1].value,
            }));
          }
          return;
        }

        case Keys.ARROW_UP: {
          event.preventDefault();
          const changeIndex = selectedIndexAndValue.index - 1 >= 0;
          if (changeIndex) {
            setSelectedIndexAndValue((prev) => ({
              index: prev.index - 1,
              value: options[prev.index - 1].value,
            }));
          }
          return;
        }

        case Keys.ENTER: {
          event.preventDefault();
          onSelect(selectedIndexAndValue.value);
          setShowDropDownMenu(false);
          return;
        }

        case Keys.ESCAPE: {
          event.preventDefault();
          setShowDropDownMenu(false);
          return;
        }

        default:
          return;
      }
    },
    [
      onSelect,
      options,
      selectedIndexAndValue.index,
      selectedIndexAndValue.value,
    ],
  );

  useEffect(() => {
    // for us to be able to navigate the list with keyboard events
    if (showDropDownMenu) {
      document.body.addEventListener('keydown', onKeyDown);
    }
    return () => document.body.removeEventListener('keydown', onKeyDown);
  }, [showDropDownMenu, onKeyDown]);

  const menu = useMemo(() => {
    // height of menu item * 5, then add the padding of menu
    const menuMaxHeight = ROW_HEIGHT * 5 + 16;
    return (
      <Menu2 maxHeight={`${menuMaxHeight}px`} fullWidth>
        {options.map((option, index) => (
          <MenuItem2
            key={index}
            label={option.label}
            onClick={(e: any) => {
              e.stopPropagation();
              onSelect(option.value);
              setShowDropDownMenu(false);
            }}
            leftItem={
              option.value === definedValue ? (
                <Icon2 name="Check" size="large" />
              ) : (
                <Box2 height="l" width="l" style={{ flexShrink: 0 }} />
              )
            }
            selected={selectedIndexAndValue.index === index}
            onMouseOver={() =>
              setSelectedIndexAndValue({ index, value: option.value })
            }
            disableHoverStyles
          />
        ))}
      </Menu2>
    );
  }, [options, selectedIndexAndValue.index, onSelect, definedValue]);

  const toggleShowMenu = useCallback(
    () => setShowDropDownMenu(!showDropDownMenu),
    [showDropDownMenu],
  );

  const closeMenu = useCallback(() => setShowDropDownMenu(false), []);

  return (
    <BoxWithPopper2
      popperElement={menu}
      popperElementVisible={showDropDownMenu}
      popperPosition="top-start"
      onShouldHide={closeMenu}
      className={classes.select}
      withBlockingOverlay={true}
      popperWidth="full"
    >
      <Row2 onClick={toggleShowMenu}>
        <Text2
          marginLeft={'2xs'}
          color="content-emphasis"
          role="button"
          ellipsis
        >
          {optionsValueLabelObject[definedValue]}
        </Text2>
        <Icon2 name="DownSolid" size="small" marginLeft="4xs" />
      </Row2>
    </BoxWithPopper2>
  );
}
