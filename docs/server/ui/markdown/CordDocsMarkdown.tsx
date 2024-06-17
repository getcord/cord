/** @jsxImportSource @emotion/react */

import Markdown from 'markdown-to-jsx';
import { useEffect, useState } from 'react';
import CodeBlock from 'docs/server/ui/codeBlock/CodeBlock.tsx';
import languageMap from 'docs/server/ui/markdown/languageMap.ts';
import FakeP from 'docs/server/ui/markdown/FakeP.tsx';

// This file exists because of the way markdown processors handle multi-line
// code blocks.
// For instance, say you create some markdown with a line like:
//
// # My Sweet Markdown
// ```js
//   console.log('foo');
// ```
//
// Markdown processors will create markup of the form:
// <h1>My Sweet Markdown</h1>
// <pre>
//   <code>
//     console.log('foo');
//   </code>
// </pre>
//
// For a syntax highlighter that runs after the page has been rendered (e.g.
// rouge or whatever), that's a boring detail. However, for us with our
// pre-rendered pages and React-based highlighter, this creates a real pickle.
// Even worse, we've written our interactive componentry around a base syntax
// highlighter. For our case, having two level of DOM nodes creates a bit of a
// pickle.
//
// Our markdown translator lets you override the rendering for a particular
// element. Fine. So which element? The <pre> or the <code>?  Well... we can't
// be sure either is safe. What if someone creates a <pre> tag or a <code> tag
// of their own in their markdown? So, the only safe bet is to override a <pre>
// tag with a single child which is a <code> element. There's no straightforward
// way to do that override. By the time we get to the override stage of the
// rendering, we no longer have string contents. The markdown engine has already
// converted everything into vanilla React HTML elements, which are not nice to
// work with.
//
// So, in the end, we wind up here. This component pre-processes the markdown
// string before it ever goes into the markdown processor. This converts the
// multiline code blocks into a CodeBlock component. That way, all the cool
// interactive stuff we've built like the "Copy" button and the top label that
// tells you what language the code snippet is in.

// An interstitial component for transferring the code out of multiline codeblock
// and into our internal CodeBlock element.
type MarkdownCodeBlockProps = {
  language: string;
  code: string;
};
function MarkdownCodeBlock({ language, code }: MarkdownCodeBlockProps) {
  const [clientRender, setClientRender] = useState<boolean>(false);

  useEffect(() => {
    setClientRender(true);
  }, [language, code, setClientRender]);

  const parsedCode = atob(code); // Buffer.from doesn't exist in the browser.
  if (!clientRender) {
    return (
      <pre>
        <code css={{ display: 'block' }}>{parsedCode}</code>
      </pre>
    );
  }

  let lang = language || 'plaintext';
  let languageDisplayName = lang;
  const mapping = languageMap[lang];
  if (mapping) {
    lang = mapping.language;
    languageDisplayName = mapping.languageDisplayName;
  }
  return (
    <CodeBlock
      snippetList={[
        {
          language: lang,
          languageDisplayName,
          snippet: parsedCode,
        },
      ]}
    />
  );
}

type CordDocsMarkdownProps = {
  value: string;
};

function CordDocsMarkdown({ value }: CordDocsMarkdownProps) {
  let v = value;
  let multilineCodeBlockIndex = v.indexOf('```');
  while (multilineCodeBlockIndex !== -1) {
    const closingTicksIndex = v.indexOf('```', multilineCodeBlockIndex + 3);

    if (!closingTicksIndex) {
      // If we're here, we've got some sort of janky multiline code block
      console.warn('Invalid code block in markdown: ' + value);
      return (
        <pre>
          <code>
            Unclosed multiline codeblock:
            {value}
          </code>
        </pre>
      );
    }

    const codeblock = v.substring(
      multilineCodeBlockIndex,
      closingTicksIndex + 3,
    );
    let replacement =
      '```\nThere was an error processing this code snippet. :( \n```';
    const codeMatch = codeblock.match(/^```(.*)\n((?:.|\n)*)\n```/m);
    if (codeMatch) {
      const language = codeMatch[1];
      const code = btoa(codeMatch[2]);
      replacement = `<MarkdownCodeBlock language="${language}" code="${code}" />`;
    } else {
      throw new Error('Failed to pre-process codeblock: ' + codeblock);
    }

    v =
      v.substring(0, multilineCodeBlockIndex) +
      replacement +
      v.substring(closingTicksIndex + 3);
    multilineCodeBlockIndex = v.indexOf('```');
  }

  return (
    <Markdown
      options={{
        overrides: {
          p: {
            component: FakeP,
          },
          MarkdownCodeBlock: {
            component: MarkdownCodeBlock,
          },
        },
        forceBlock: true,
      }}
    >
      {v}
    </Markdown>
  );
}

export default CordDocsMarkdown;
