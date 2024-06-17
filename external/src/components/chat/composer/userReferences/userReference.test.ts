/**
 * @jest-environment jsdom
 */
import { Transforms } from 'slate';
import { createParagraphNode } from '@cord-sdk/react/common/lib/messageNode.ts';
import { getUserReferenceSearchParameters } from 'external/src/components/chat/composer/userReferences/util.ts';
import { createEditor } from 'external/src/editor/createEditor.ts';

const createNewEditor = (text: string, selectionOffset: number) => {
  const editor = createEditor();
  Transforms.insertNodes(editor, createParagraphNode(text));
  Transforms.setSelection(editor, createRangeAtOffset(selectionOffset));
  return editor;
};

const createRangeAtOffset = (
  anchorOffset: number,
  focusOffset = anchorOffset,
) => ({
  anchor: { path: [0, 0], offset: anchorOffset },
  focus: { path: [0, 0], offset: focusOffset },
});

type TestCase = [
  [string, number],
  (
    | undefined
    | { search: string; range: [number, number]; type: 'mention' | 'assignee' }
  ),
];

const runTest = (testCategory: string, testCase: TestCase) => {
  const [[text, selectionOffset], equalsConfig] = testCase;
  const editor = createNewEditor(text, selectionOffset);
  test(`${testCategory}: ${text}, ${selectionOffset}`, () =>
    expect(getUserReferenceSearchParameters(editor, true)).toEqual(
      !equalsConfig
        ? equalsConfig
        : {
            ...equalsConfig,
            range: createRangeAtOffset(...equalsConfig.range),
          },
    ));
};

const mentionTestCases: TestCase[] = [
  [['hello @hen', 7], { search: '', range: [6, 7], type: 'mention' }],
  [['hello @hen', 8], { search: 'h', range: [6, 8], type: 'mention' }],
  [['hello @hen', 10], { search: 'hen', range: [6, 10], type: 'mention' }],
  [['hello @hen hi', 10], { search: 'hen', range: [6, 10], type: 'mention' }],
  [['@hen', 1], { search: '', range: [0, 1], type: 'mention' }],
  [['@hen', 3], { search: 'he', range: [0, 3], type: 'mention' }],
  [['@hen', 4], { search: 'hen', range: [0, 4], type: 'mention' }],
  [['@hen', 0], undefined],
  [['@ hen', 5], undefined],
  [['@hen hi', 7], { search: 'hen hi', range: [0, 7], type: 'mention' }],
  [['hello @hen', 6], undefined],
  [['@hen ', 6], { search: 'hen ', range: [0, 6], type: 'mention' }],
  [['@h ', 3], { search: 'h ', range: [0, 3], type: 'mention' }],
  [['@h  ', 4], undefined],
  [['@h.', 3], { search: 'h.', range: [0, 3], type: 'mention' }],
  [['@h/', 3], { search: 'h/', range: [0, 3], type: 'mention' }],
  [['@h@', 3], { search: 'h@', range: [0, 3], type: 'mention' }],
  [['@Renée', 6], { search: 'Renée', range: [0, 6], type: 'mention' }],
  [['@Noël', 4], { search: 'Noë', range: [0, 4], type: 'mention' }],
  [['@John-Paul', 8], { search: 'John-Pa', range: [0, 8], type: 'mention' }],
  [['@KŠthe', 6], { search: 'KŠthe', range: [0, 6], type: 'mention' }],
  [["@O'Connell", 7], { search: "O'Conn", range: [0, 7], type: 'mention' }],
  [['@4ndrei', 7], { search: '4ndrei', range: [0, 7], type: 'mention' }],
];

const assigneeTestCases: TestCase[] = mentionTestCases.map((testCase) => {
  return [
    [testCase[0][0].replace('@', '+'), testCase[0][1]],
    !testCase[1]
      ? testCase[1]
      : {
          ...testCase[1],
          type: 'assignee',
        },
  ];
});

const combinedTestCases: TestCase[] = [
  [['hi @hen+ry', 8], { search: 'hen+', range: [3, 8], type: 'mention' }],
  [['hi @hen+ry', 7], { search: 'hen', range: [3, 7], type: 'mention' }],
  [['hi +hen@ry', 8], { search: 'hen@', range: [3, 8], type: 'assignee' }],
  [['hi +hen@ry', 7], { search: 'hen', range: [3, 7], type: 'assignee' }],
];

for (const testCase of mentionTestCases) {
  runTest('Mentions', testCase);
}

for (const testCase of assigneeTestCases) {
  runTest('Assignees', testCase);
}

for (const testCase of combinedTestCases) {
  runTest('Mentions & Assignees', testCase);
}
