import { useCallback, useState } from 'react';
import { createUseStyles } from 'react-jss';

import { cssVar } from 'common/ui/cssVariables.ts';

import { Row2 } from 'external/src/components/ui2/Row2.tsx';
import { Tab2 } from 'external/src/components/ui2/Tab2.tsx';

type Props = {
  tabItems: string[];
  defaultActiveTab: number;
  onTabSelected: (activeTabIndex: number) => unknown;
};

const useStyles = createUseStyles({
  tabItemsContainer: {
    gap: cssVar('space-3xs'),
  },
});

export const TabGroup2 = ({
  tabItems,
  defaultActiveTab,
  onTabSelected,
}: Props) => {
  const classes = useStyles();
  const [activeTabIndex, setActiveTabIndex] =
    useState<number>(defaultActiveTab);

  const onTabClick = useCallback(
    (tabIndex: number) => {
      setActiveTabIndex(tabIndex);
      onTabSelected(tabIndex);
    },
    [onTabSelected],
  );

  return (
    <ol>
      <Row2
        className={classes.tabItemsContainer}
        backgroundColor="base-strong"
        borderRadius="medium"
        padding="3xs"
      >
        {tabItems.map((tab, index) => (
          <Tab2
            key={`tab2-${index}`}
            tabIndex={index}
            title={tab}
            activeTabIndex={activeTabIndex}
            onClick={onTabClick}
          />
        ))}
      </Row2>
    </ol>
  );
};
