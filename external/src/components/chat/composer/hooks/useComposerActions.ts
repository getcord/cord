import { useMemo } from 'react';

import { useComposerTask } from 'external/src/components/chat/composer/hooks/useComposerTask.ts';
import { useAnnotationCreator } from 'external/src/components/chat/composer/hooks/useAnnotationCreator.ts';
import { ComposerContext } from 'external/src/context/composer/ComposerContext.ts';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';

export function useComposerActions() {
  const createAnnotation = useAnnotationCreator();
  const { startAttachFlow } = useContextThrowingIfNoProvider(ComposerContext);
  const { addTask, removeTask } = useComposerTask();

  return useMemo(
    () => ({
      createAnnotation,
      startAttachFlow,
      addTask,
      removeTask,
    }),
    [addTask, createAnnotation, removeTask, startAttachFlow],
  );
}
