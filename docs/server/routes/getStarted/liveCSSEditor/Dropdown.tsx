/** @jsxImportSource @emotion/react */

import { useEffect, useMemo, useState } from 'react';
import * as Select from '@radix-ui/react-select';

const styles = {
  itemRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    alignItems: 'center',
    padding: '10px',
    '& svg': {
      width: '16px',
      height: '16px',
    },
  },
  selectedItemRow: {
    gap: '12px',
  },
  root: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DADCE0',
    padding: '2px',
    borderRadius: '4px',
  },
} as const;

type Props<T extends string> = {
  menuItems: Array<{
    label: string;
    key: T;
    leftItem: JSX.Element;
  }>;
  initialKey: T;
  onSelectedKey: (key: T) => void;
};

export function Dropdown<T extends string>({
  menuItems,
  initialKey,
  onSelectedKey,
}: Props<T>) {
  const [selectedKey, setSelectedKey] = useState<string>(initialKey);

  useEffect(
    () => onSelectedKey(selectedKey as T),
    [onSelectedKey, selectedKey],
  );

  const selectedItem = useMemo(
    () => menuItems.find((item) => item.key === selectedKey)!,
    [menuItems, selectedKey],
  );

  return (
    <Select.Root onValueChange={setSelectedKey} defaultValue={initialKey}>
      <Select.Trigger css={styles.root}>
        <Select.Value>
          <div css={{ ...styles.itemRow, ...styles.selectedItemRow }}>
            {selectedItem.leftItem} <div>{selectedItem.label}</div>
          </div>
        </Select.Value>
        <Select.Content
          position="popper"
          sideOffset={4}
          css={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #DADCE0',
            borderRadius: 4,
            boxShadow: 'var(--box-shadow-small)',
            padding: 4,
            width: 'var(--radix-select-trigger-width)',
          }}
        >
          {menuItems.map((item) => (
            <Select.Item key={item.key} value={item.key}>
              <Select.ItemText>
                <div css={styles.itemRow}>
                  {item.leftItem} <div>{item.label}</div>
                </div>
              </Select.ItemText>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Trigger>
    </Select.Root>
  );
}
