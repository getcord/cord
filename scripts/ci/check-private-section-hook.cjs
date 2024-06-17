#!/usr/bin/env node

// This script is similar to check-private-section.cjs which is used in CI.  This
// one is used for a local commit hook to help you guard against pushing a commit
// which will fail in CI.

const commitMessage = process.env.COMMIT_MESSAGE;

const regex = new RegExp(
  '^CORD PRIVATE SECTION START$.*^CORD PRIVATE SECTION END$',
  // s = dotAll (. matches new lines)
  // m = multiline (^ and $ still match beginning and end of a line)
  'sm',
);

if (regex.test(commitMessage)) {
  process.exit(0);
}

process.exit(1);
