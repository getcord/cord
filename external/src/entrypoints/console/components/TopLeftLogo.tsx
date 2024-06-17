import { createUseStyles } from 'react-jss';

import { CordLogoIcon } from 'external/src/components/ui/icons/CordLogo.tsx';

const useStyles = createUseStyles({
  logoText: {
    alignItems: 'center',
    color: '#000',
    display: 'inline-flex',
    fontSize: 15,
    height: 24,
    padding: '0 8px',
    textDecoration: 'none',
  },
  '&:hover': {
    color: '#000',
    textDecoration: 'none',
  },
});

export function TopLeftLogo() {
  const styles = useStyles();
  return (
    <>
      <CordLogoIcon width={74} height={24} />
      <span className={styles.logoText}>Console</span>
    </>
  );
}
