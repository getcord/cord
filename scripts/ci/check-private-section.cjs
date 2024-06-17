#!/usr/bin/env node

const prBody = process.env.PR_BODY;

const regex = new RegExp(
  '^CORD PRIVATE SECTION START$.*^CORD PRIVATE SECTION END$',
  // s = dotAll (. matches new lines)
  // m = multiline (^ and $ still match beginning and end of a line)
  'sm',
);

if (regex.test(prBody)) {
  process.exit(0);
}

console.log(`Because your PR changes files in opensource/
you need to add to your PR description:

CORD PRIVATE SECTION START
<some number of lines, possibly zero>
CORD PRIVATE SECTION END

Once you have updated your PR description, update your PR to
re-trigger the lint check`);

process.exit(1);
