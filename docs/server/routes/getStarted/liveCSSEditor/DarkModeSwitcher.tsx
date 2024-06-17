/** @jsxImportSource @emotion/react */

import { Icon } from 'external/src/components/ui3/icons/Icon.tsx';

const styles = {
  container: {
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'row',
    gap: '8px',
    justifyContent: 'space-around',
    padding: '8px',
    backgroundColor: '#F6F6F6',
    borderRadius: '4px',
  },
  option: {
    padding: '8px',
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',

    justifyContent: 'center',
  },
  selectedOption: {
    backgroundColor: '#FFFFFF',
  },
} as const;

type DarkModeSwitcherProps = {
  selectedMode: 'light' | 'dark';
  setSelectedMode: (mode: 'light' | 'dark') => void;
};
export function DarkModeSwitcher({
  selectedMode,
  setSelectedMode,
}: DarkModeSwitcherProps) {
  return (
    <div css={styles.container}>
      <div
        onClick={() => setSelectedMode('light')}
        css={[
          styles.option,
          selectedMode === 'light' ? styles.selectedOption : {},
        ]}
      >
        <Icon name="Sun" />
        <div>Light mode</div>
      </div>
      <div
        onClick={() => setSelectedMode('dark')}
        css={[
          styles.option,
          selectedMode === 'dark' ? styles.selectedOption : {},
        ]}
      >
        <Icon name="Moon" />
        <div>Dark mode</div>
      </div>
    </div>
  );
}
