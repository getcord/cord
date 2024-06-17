import type { DocumentNode, OperationDefinitionNode } from 'graphql';
import { print as printGraphQL } from 'graphql';
import { API_ORIGIN } from 'common/const/Urls.ts';
import { toDeploymentType } from 'common/types/index.ts';

const serializedOperationCache: Record<string, string> = {};

const serializedOperation = (operation: DocumentNode) => {
  const operationName = (
    operation.definitions.find(
      ({ kind }) => kind === 'OperationDefinition',
    ) as OperationDefinitionNode
  ).name!.value;

  let query = serializedOperationCache[operationName];
  if (!query) {
    query = printGraphQL(operation);
    serializedOperationCache[operationName] = query;
  }

  return { operationName, query };
};

export async function graphQLRequest<TResult = any, TVariables = any>(
  operation: DocumentNode,
  variables: TVariables | undefined = undefined,
  authHeader = '',
): Promise<TResult> {
  const { operationName, query } = serializedOperation(operation);

  const response = await fetch(`${API_ORIGIN}/gql`, {
    method: 'post',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader,
      'x-version': BUILDCONSTANTS.version,
      'x-deployment':
        toDeploymentType(BUILDCONSTANTS.deployment) ?? 'undefined',
    },
    body: JSON.stringify({
      operationName,
      variables,
      query,
    }),
  });

  if (response.status !== 200) {
    const errorStr = await response.text();
    throw new Error(
      `[graphQLRequest] ${operationName} failed with status ${response.status}. Error details: ${errorStr}`,
    );
  }

  return (await response.json()).data;
}
