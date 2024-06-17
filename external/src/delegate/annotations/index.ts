import type { MessageAnnotation } from 'common/types/index.ts';
import type { ThirdPartyObjects } from 'external/src/context/delegate/DelegateContext.ts';
import { Annotation } from 'external/src/delegate/annotations/Annotation.ts';
import { MonacoEditorAnnotation } from 'external/src/delegate/annotations/MonacoEditorAnnotation.ts';
import { ReactTreeAnnotation } from 'external/src/delegate/annotations/ReactTreeAnnotation.ts';
import { CustomAnnotation } from 'external/src/delegate/annotations/CustomAnnotation.ts';
import { MissingAnnotation } from 'external/src/delegate/annotations/MissingAnnotation.ts';
import type { AnnotationSDKContextType } from 'external/src/context/annotations/AnnotationSDKContext.ts';

/**
 * Create an Annotation/MonacoEditorAnnotation/ReactTreeAnnotation/IframeAnnotation
 * Pass scope as 'iframe' if used in our iframe embed script listeners
 */
export function createAnnotationInstance({
  annotation,
  thirdPartyObjects,
  getAnnotationPosition,
}: {
  annotation: MessageAnnotation;
  thirdPartyObjects: ThirdPartyObjects;
  getAnnotationPosition: AnnotationSDKContextType['getAnnotationPosition'];
}) {
  const { location, customLocation } = annotation;

  if (customLocation) {
    return new CustomAnnotation(annotation, getAnnotationPosition);
  }

  if (!location) {
    return new MissingAnnotation();
  }

  if (location.additionalTargetData?.monacoEditor) {
    const { monacoID } = location.additionalTargetData.monacoEditor;
    return new MonacoEditorAnnotation({
      location,
      monacoEditorWrapper:
        thirdPartyObjects.monacoEditors.getMonacoEditorWrapper(monacoID),
    });
  }
  if (location.additionalTargetData?.reactTree) {
    const { treeID } = location.additionalTargetData.reactTree;
    return new ReactTreeAnnotation({
      location,
      tree: thirdPartyObjects.reactTrees.getReactTree(treeID),
    });
  }
  return new Annotation({ location });
}
