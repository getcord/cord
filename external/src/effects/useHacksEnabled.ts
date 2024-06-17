import { OrganizationContext } from 'external/src/context/organization/OrganizationContext.tsx';
import { isEmployee } from 'common/util/index.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useHacksEnabled(): boolean {
  const { organization } = useContextThrowingIfNoProvider(OrganizationContext);

  return isEmployee(organization?.id);
}
