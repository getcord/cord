import * as fs from 'fs';
import gql from 'graphql-tag';
import { glob } from 'glob';

const graphQLFilePattern = 'external/**/*.graphql';

test('All graphQL operations have distinct names', async () => {
  const documentPaths = await glob(graphQLFilePattern, { posix: true });

  const operationNames = new Set<string>();
  for (const path of documentPaths) {
    const document = gql.default(fs.readFileSync(path, 'utf8'));
    const firstDefinition = document.definitions[0];
    if (firstDefinition.kind === 'OperationDefinition') {
      const operationName = firstDefinition.name?.value;

      if (!operationName) {
        throw new Error('Operation ' + path + ' has no name');
      } else if (operationNames.has(operationName)) {
        throw new Error('Operation ' + operationName + ' appears twice');
      } else {
        operationNames.add(operationName);
      }
    }
  }
});
