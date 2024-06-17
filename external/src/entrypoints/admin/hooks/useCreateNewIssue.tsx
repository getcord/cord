import { useCallback } from 'react';
import { useCreateCustomerIssueMutation } from 'external/src/entrypoints/admin/graphql/operations.ts';
import type { AdminCRTCustomerIssue } from 'common/types/index.ts';

export function useCreateNewIssue() {
  const [createCustomerIssueMutation] = useCreateCustomerIssueMutation();

  const createNewIssue = useCallback(
    async (customerIssue: AdminCRTCustomerIssue) => {
      const {
        customerID,
        title,
        body,
        comingFrom,
        decision,
        communicationStatus,
        type,
        priority,
        assignee,
        externallyVisible,
      } = customerIssue;

      await createCustomerIssueMutation({
        variables: {
          customerID,
          title,
          body,
          comingFrom,
          decision,
          communicationStatus,
          lastTouch: null,
          type,
          priority,
          externallyVisible,
          assignee: assignee === 'placeholder' ? null : assignee,
        },
      });
    },
    [createCustomerIssueMutation],
  );

  return createNewIssue;
}
