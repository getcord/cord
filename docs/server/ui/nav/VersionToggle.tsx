/** @jsxImportSource @emotion/react */

import { useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import {
  Root,
  Trigger,
  Value,
  Content,
  Item,
  ItemText,
  Icon,
} from '@radix-ui/react-select';

import { useLocation, useNavigate } from 'react-router-dom';
import { VersionContext } from 'docs/server/App.tsx';
import type { CordVersion } from 'docs/server/App.tsx';
import { showBeta } from 'docs/lib/showBeta.ts';

const styles = {
  item: {
    '&:focus-visible': {
      outline: 'none',
      backgroundColor: 'var(--color-purpleLight)',
      borderRadius: '4px',
    },
  },
  itemRow: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    gap: '4px',
    alignItems: 'center',
    padding: '4px 8px',
    '& svg': {
      width: '16px',
      height: '16px',
    },
  },
  selectedItemRow: {},
  root: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DADCE0',
    padding: '2px',
    borderRadius: '4px',
    marginTop: 12,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  content: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DADCE0',
    borderRadius: 4,
    boxShadow: 'var(--box-shadow-small)',
    padding: 4,
    width: 'var(--radix-select-trigger-width)',
    zIndex: 1,
  },
} as const;

const menuItems: { key: CordVersion; label: string; icon?: ReactNode }[] = [
  { key: '1.0', label: '1.0' },
  { key: '2.0', label: '2.0 (Beta)', icon: <div>⚛️</div> },
];

export function VersionToggle() {
  const { version } = useContext(VersionContext);

  const selectedItem = useMemo(
    () => menuItems.find((item) => item.key === version)!,
    [version],
  );

  const navigate = useNavigate();
  const location = useLocation();

  if (!showBeta()) {
    return null;
  }

  return (
    <Root
      onValueChange={(r: CordVersion) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('version', r);
        navigate(`${location.pathname}?${searchParams.toString()}`);
      }}
      defaultValue={version}
    >
      <Trigger css={styles.root}>
        <Value>
          <div css={{ ...styles.itemRow, ...styles.selectedItemRow }}>
            <span>Version: {selectedItem.label}</span>
            <span>{selectedItem.icon}</span>
          </div>
        </Value>
        <Icon className="SelectScrollButton">
          <ChevronDownIcon width={20} />
        </Icon>
      </Trigger>
      <Content position="popper" sideOffset={4} css={styles.content}>
        {menuItems.map((item) => (
          <Item key={item.key} value={item.key} css={styles.item}>
            <ItemText>
              <div css={styles.itemRow}>
                <span>{item.label}</span>
                <span>{item.icon}</span>
              </div>
            </ItemText>
          </Item>
        ))}
      </Content>
    </Root>
  );
}
