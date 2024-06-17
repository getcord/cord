// Because we're likely to have markdown described as one language where syntax
// highlighter handles it better as another. Also because the markdown
// codeblocks allow annotating with a particular language syntax, but they don't
// have a way to describe what language you're using to the viewer. Our internal
// CodeBlock does this, but our open source code won't always be run through it.
// For compatibility this mapping exists.
type LanguageMap = {
  [languageShortName: string]: {
    language: string;
    languageDisplayName: string;
  };
};

const languageMap: LanguageMap = {
  js: {
    language: 'javascript',
    languageDisplayName: 'JavaScript',
  },
  jsx: {
    language: 'jsx',
    languageDisplayName: 'React',
  },
  ts: {
    language: 'typescript',
    languageDisplayName: 'TypeScript',
  },
  tsx: {
    language: 'typescript',
    languageDisplayName: 'TypeScript',
  },
  go: {
    language: 'go',
    languageDisplayName: 'Golang',
  },
  java: {
    language: 'java',
    languageDisplayName: 'Java',
  },
  html: {
    language: 'html',
    languageDisplayName: 'HTML',
  },
  css: {
    language: 'css',
    languageDisplayName: 'CSS',
  },
  plaintext: {
    language: 'plaintext',
    languageDisplayName: 'Plaintext',
  },
  json: {
    language: 'json',
    languageDisplayName: 'JSON',
  },
};

export default languageMap;
