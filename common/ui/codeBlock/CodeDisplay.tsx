import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// @ts-ignore this actually exists, is the right way to do this, the types should have it...
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism/index.js';

type CodeDisplayProps = {
  language: string;
  code: string;
};

// TODO: Replace SynthaxHighlighter with Monaco
function CodeDisplay({ language, code }: CodeDisplayProps) {
  return (
    <SyntaxHighlighter
      language={language}
      style={materialDark}
      data-cord-language={language}
    >
      {code}
    </SyntaxHighlighter>
  );
}

export default CodeDisplay;
