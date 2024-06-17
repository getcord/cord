import { useState } from 'react';

import { InlineMenu } from 'external/src/components/ui3/SimpleInlineMenu/InlineMenu.tsx';
import * as classes from 'external/src/components/ui3/SimpleInlineMenu/SimpleInlineMenu.css.ts';

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

export const SimpleInlineMenu = ({
  menuItems,
  closeMenu,
  selection,
}: Props) => {
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
    />
  );
};

export const newSimpleInlineMenuConfig = {
  NewComp: SimpleInlineMenu,
  configKey: 'simpleInlineMenu',
} as const;
