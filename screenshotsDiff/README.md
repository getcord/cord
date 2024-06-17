# Screenshot Test

## TL/DR

Run `npx playwright` to run the screenshot test.

## What is this?

Those are not usual test, instead it is a utility to help us migrate from JSS to Vanilla Extract and stable classnames.
It will make screensthots and show the difference. This should help us catching potential style breaking.

1. Run `npm run make-snapshots` to run on master (or commit you want to compare with).
1. Checkout the commit you want to check
1. Run `npm run test` to run.
1. It will pass :tada: or fail and give you screenshots of actual, epxected and the diff.

## I want more.

Read test-spec.js

It load the test bed, find the component set dropdown pick one and then make a screenshot.

If you need you can add a test for other component test.
