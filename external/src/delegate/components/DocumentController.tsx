import { ActionModal } from 'external/src/components/ui3/ActionModal.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { DelegateContext } from 'external/src/context/delegate/DelegateContext.ts';

export function DocumentController() {
  const {
    state: { confirmModal },
  } = useContextThrowingIfNoProvider(DelegateContext);

  return <>{confirmModal && <ActionModal {...confirmModal} />}</>;
}
