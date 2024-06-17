import {
  extractCordEmailUUID,
  getReplyToEmailAddress,
} from 'server/src/email/utils.ts';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

test('inject id into Cord email address', () => {
  expect(
    getReplyToEmailAddress(
      anonymousLogger(),
      'Cord <cord@cord.fyi>',
      '48efa35f-fbe0-44d7-97cb-58bfb018f0ab',
    ),
  ).toEqual('Cord <cord-48efa35f-fbe0-44d7-97cb-58bfb018f0ab@cord.fyi>');
});

test('inject id into Typeform email address', () => {
  expect(
    getReplyToEmailAddress(
      anonymousLogger(),
      'Typeform <typeform-notifications@cord.fyi>',
      '48efa35f-fbe0-44d7-97cb-58bfb018f0ab',
    ),
  ).toEqual(
    'Typeform <typeform-notifications-48efa35f-fbe0-44d7-97cb-58bfb018f0ab@cord.fyi>',
  );
});

test('inject id into nameless email address', () => {
  expect(
    getReplyToEmailAddress(
      anonymousLogger(),
      'someprovider@cord.fyi',
      '48efa35f-fbe0-44d7-97cb-58bfb018f0ab',
    ),
  ).toEqual('someprovider-48efa35f-fbe0-44d7-97cb-58bfb018f0ab@cord.fyi');
});

test('inject id into white-label email address', () => {
  expect(
    getReplyToEmailAddress(
      anonymousLogger(),
      'hello@example.com',
      '48efa35f-fbe0-44d7-97cb-58bfb018f0ab',
    ),
  ).toEqual('hello-48efa35f-fbe0-44d7-97cb-58bfb018f0ab@cord.fyi');
});

test('extract id from email address', () => {
  const testAddresses = [
    'Cord <cord@cord.fyi>',
    'Typeform <typeform-notifications@cord.fyi>',
    'someprovider@cord.fyi',
  ];

  const id = '48efa35f-fbe0-44d7-97cb-58bfb018f0ab';
  for (const emailAddress of testAddresses) {
    const emailWithId = getReplyToEmailAddress(
      anonymousLogger(),
      emailAddress,
      id,
    );
    expect(extractCordEmailUUID(emailWithId)).toEqual(id);
  }
});

test('dont extract id from email address that dont have it', () => {
  const testAddresses = [
    'Cord <cord@cord.fyi>',
    'Typeform <typeform-notifications@cord.fyi>',
    'someprovider@cord.fyi',
    'abc-notUUID-it-just-has-the-right-length@cord.fyi',
  ];
  for (const emailAddress of testAddresses) {
    expect(extractCordEmailUUID(emailAddress)).toEqual(null);
  }
});

test('extract id from email address list', () => {
  const emailList =
    'Spendflo <spendflo-notifications-ad85bcae-b68e-4f97-97ba-9b5fd827fd93@cord.fyi>,  Anonym S <anonym@spendflo.com>';
  const expected = 'ad85bcae-b68e-4f97-97ba-9b5fd827fd93';
  expect(extractCordEmailUUID(emailList)).toEqual(expected);
});
