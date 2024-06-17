/** @jsxImportSource @emotion/react */

import { Link } from 'react-router-dom';
import { Warning } from 'docs/server/routes/components/Warning/Warning.tsx';

export function BetaComponentWarning({ plural }: { plural?: boolean }) {
  return (
    <Warning type="beta">
      <p>
        {plural ? 'These components are' : 'This component is'} in development;
        interface and features are subject to change prior to final release.
      </p>
      <p>
        Visit the{' '}
        <Link to="/customization/custom-react-components/tutorial">
          Replacements API step by step guide
        </Link>
        .
      </p>
    </Warning>
  );
}
