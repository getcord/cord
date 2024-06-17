import { useState } from 'react';
import { createUseStyles } from 'react-jss';

import { InlineMenu } from 'external/src/components/InlineMenu.tsx';
import { Sizes } from 'common/const/Sizes.ts';
import { Colors } from 'common/const/Colors.ts';
import { withNewCSSComponentMaybe } from 'external/src/components/ui3/withNewComponent.tsx';
import { newSimpleInlineMenuConfig } from 'external/src/components/ui3/SimpleInlineMenu/index.ts';

const useStyles = createUseStyles({
  itemIconWrapper: {
    alignItems: 'center',
    display: 'flex',
    flex: 'none',
    marginRight: Sizes.MEDIUM,
  },
  itemTitle: {
    flex: 1,
  },
});

type MenuItem = {
  id: string;
  onClick: () => void;
  title: string;
  icon?: JSX.Element;
};

type Props = {
  menuItems: MenuItem[];
  closeMenu: () => void;
  selection?: {
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
  };
};

export const SimpleInlineMenu = withNewCSSComponentMaybe(
  newSimpleInlineMenuConfig,
  ({ menuItems, closeMenu, selection }: Props) => {
    const classes = useStyles();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    return (
      <InlineMenu
        items={menuItems}
        // Props optionally allow controlling selection outside of this component
        selectedIndex={selection?.selectedIndex ?? selectedIndex}
        setSelectedIndex={selection?.setSelectedIndex ?? setSelectedIndex}
        onItemClick={(item) => {
          closeMenu();
          item.onClick();
        }}
        renderItem={(item) => (
          <>
            {item.icon && (
              <div className={classes.itemIconWrapper}>{item.icon}</div>
            )}
            <span className={classes.itemTitle}>{item.title}</span>
          </>
        )}
        itemStyle={{
          color: Colors.GREY_DARK,
        }}
      />
    );
  },
);
