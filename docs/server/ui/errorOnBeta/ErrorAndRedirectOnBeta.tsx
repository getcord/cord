import { useCallback, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VersionContext } from 'docs/server/App.tsx';
import { Warning } from 'docs/server/routes/components/Warning/Warning.tsx';

export function ErrorOnBeta({ children }: { children: React.ReactNode }) {
  const { version } = useContext(VersionContext);

  const [currentQueryParameters, setSearchParams] = useSearchParams();
  const onSwitchVersionClick = useCallback(() => {
    setSearchParams({ ...currentQueryParameters, version: '1.0' });
  }, [currentQueryParameters, setSearchParams]);

  if (version === '2.0') {
    return (
      <Warning type="beta">
        <p>
          This component is not available in beta.{' '}
          <a href="#" onClick={onSwitchVersionClick}>
            Switch version to 1.0.
          </a>
        </p>
      </Warning>
    );
  }
  return children;
}
