# Cord Docs

Our docs are written in React TSX code. If you're coming at this fresh, you
might find that surprising. Why wouldn't they use a document generation
framework for it?

Yeah... fair, honestly. We invented this here, so it's definitely better.

# How to run the docs?

If you run the monorepo repo with `npm run local-dev` and/or `npm run watch`,
you'll have the docs running at `https://local.cord.com:8191`.

# How does the docs search work?

Please read the comment in `scripts/docs-generate-search-data.ts`
for a very detailed explanation. All you really need to worry about for the
moment is that when you change the content of the docs, you should re-run the
search data generation script:

`./dist/scripts/docs-generate-search-data.ts`

That script will add two generated files to the codebase. Please commit those
alongside your content changes. If you do that, everything should work fine.

That script should probably be run automagically in the build process.
