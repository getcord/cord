import { useMemo, useState, useCallback, useEffect } from 'react';

import { PinnedAnnotationsContext } from 'external/src/context/annotations/PinnedAnnotationsContext.ts';
import type { UUID } from 'common/types/index.ts';
import type { AnnotationOnPage } from 'external/src/context/annotationsOnPage/AnnotationsOnPageContext.ts';
import { DEFAULT_PIN_SIZE } from 'external/src/delegate/components/AnnotationPointer.tsx';

type AnnotationDisplayInfo = AnnotationOnPage & {
  annotationSetID: UUID[];
};

export function PinnedAnnotationsProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const [annotationSets, setAnnotationSets] =
    useState<Map<UUID, AnnotationOnPage[]>>();
  const [pinSize, setPinSize] = useState<number>(DEFAULT_PIN_SIZE);

  const addAnnotationSet = useCallback(
    (annotationSetID: UUID, annotations: AnnotationOnPage[]) => {
      setAnnotationSets(
        (prev) => new Map([...(prev ?? []), [annotationSetID, annotations]]),
      );
    },
    [],
  );

  const [allAnnotations, setAllAnnotations] =
    useState<Map<UUID, AnnotationDisplayInfo>>();

  useEffect(() => {
    if (annotationSets) {
      const map = new Map();
      for (const [annotationSetID, annotations] of annotationSets) {
        for (const annotation of annotations) {
          if (
            map.has(annotation.id) &&
            !map.get(annotation.id)?.annotationSetID.includes(annotationSetID)
          ) {
            map.get(annotation.id).annotationSetID.push(annotationSetID);
          } else {
            map.set(annotation.id, {
              ...annotation,
              annotationSetID: [annotationSetID],
            });
          }
        }
      }
      setAllAnnotations(map);
    }
  }, [annotationSets]);

  const removeAnnotationSet = useCallback((annotationSetID: UUID) => {
    setAnnotationSets((prev) => {
      if (!prev) {
        return;
      }

      return new Map(
        [...prev].filter(([key, _value]) => key !== annotationSetID),
      );
    });
  }, []);

  const annotationIDsOnPage = useMemo(() => {
    const map = new Map();

    if (!annotationSets) {
      return map;
    }

    for (const [id, annotations] of annotationSets) {
      const annotationIDs = annotations.map((annotation) => annotation.id);
      map.set(id, new Set(annotationIDs));
    }

    return map;
  }, [annotationSets]);

  const isAnnotationOnPage = useCallback(
    (annotationSetID: UUID, annotationID: UUID) => {
      const annotationSet = annotationIDsOnPage.get(annotationSetID);
      if (annotationSet) {
        return annotationSet.has(annotationID);
      }
      return false;
    },
    [annotationIDsOnPage],
  );

  const getAnnotationPinsToRender = useCallback(
    (annotationSetID: UUID | undefined) => {
      if (!annotationSets || !annotationSetID || !allAnnotations) {
        return [];
      }
      const pinsToRender: AnnotationOnPage[] = [];
      for (const [_annotationID, annotationDisplayInfo] of allAnnotations) {
        // We've arbitrarily chosen the first set (`annotationSetID[0]`) to be the one rendering the pins.
        const arbitrarilyChosenAnnotationSetID =
          annotationDisplayInfo.annotationSetID[0];

        if (arbitrarilyChosenAnnotationSetID === annotationSetID) {
          pinsToRender.push(annotationDisplayInfo);
        }
      }

      return pinsToRender;
    },
    [allAnnotations, annotationSets],
  );

  const setAnnotationPinSize = useCallback((size: string) => {
    const sizeValue = parseInt(size);
    if (sizeValue) {
      setPinSize(sizeValue);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      addAnnotationSet,
      removeAnnotationSet,
      isAnnotationOnPage,
      getAnnotationPinsToRender,
      setAnnotationPinSize,
      annotationPinSize: pinSize,
    }),
    [
      addAnnotationSet,
      getAnnotationPinsToRender,
      isAnnotationOnPage,
      removeAnnotationSet,
      setAnnotationPinSize,
      pinSize,
    ],
  );

  return (
    <PinnedAnnotationsContext.Provider value={contextValue}>
      {children}
    </PinnedAnnotationsContext.Provider>
  );
}
