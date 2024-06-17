import { isHelpMessage } from 'server/src/util/isHelpMessage.ts';

test('isHelpMessage', () => {
  for (const help of [
    'help',
    ' help',
    'help!',
    '  help !!!',
    'help\n',
    '\n\nhelp\n',
    'HELP',
  ]) {
    expect(isHelpMessage(help)).toBeTruthy();
  }

  for (const notHelp of [
    '',
    '\n',
    'not help',
    '0help',
    'where is the help',
    'phelps',
  ]) {
    expect(isHelpMessage(notHelp)).toBeFalsy();
  }
});
