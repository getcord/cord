/** @jsxImportSource @emotion/react */

import { useContext } from 'react';
import { PreferenceContext } from 'docs/server/state/PreferenceContext.tsx';

type CodeMap = {
  [codeName: string]: React.ReactNode;
};

type InlineCodeProps = {
  codeMap: CodeMap;
  readFromPreferencesFor?: 'client' | 'server';
  renderAsFragment?: boolean;
};

function InlineCode({
  codeMap,
  readFromPreferencesFor,
  renderAsFragment,
}: InlineCodeProps) {
  const codeDisplayNames = Object.keys(codeMap);

  if (!codeDisplayNames.length) {
    throw new Error('Inline code element with no code to display');
  }

  const preferenceContext = useContext(PreferenceContext);

  let code = codeMap[codeDisplayNames[0]];
  if (
    readFromPreferencesFor === 'client' &&
    preferenceContext.clientLanguage &&
    codeDisplayNames.includes(preferenceContext.clientLanguage)
  ) {
    code = codeMap[preferenceContext.clientLanguage];
  } else if (
    readFromPreferencesFor === 'server' &&
    preferenceContext.serverLanguage &&
    codeDisplayNames.includes(preferenceContext.serverLanguage)
  ) {
    code = codeMap[preferenceContext.serverLanguage];
  }
  if (renderAsFragment) {
    return <>{code}</>;
  }
  return <code>{code}</code>;
}

export default InlineCode;
