import type { LocationMatch } from 'common/types/index.ts';
import type { MonacoEditors } from 'external/src/delegate/annotations/MonacoEditors.ts';
import type { ReactTrees } from 'external/src/delegate/annotations/ReactTrees.ts';

export type MonacoEditorInstance = {
  getTargetAtClientPoint: (
    x: number,
    y: number,
  ) => { position: { lineNumber: number } } | null;
  getModel: () => { getLineCount: () => number };
  revealLineInCenter: (lineToScrollTo: number) => void;
};

export type ReactTreeInstance = {
  state: {
    // Keys for nodes currently expanded
    expandedKeys: string[];
    // Nodes that are open (i.e. all their ancestors are expanded)
    flattenNodes: Array<{ key: string }>;
    // All nodes, whether open or closed
    keyEntities: {
      [key: string]: { key: string; level: number; pos: string };
    };
  };
  scrollTo: (args: { key: string }) => void;
  props: {
    // prefix className passed to reactTree. Examples: 'salto-file-tree', 'output-tree'
    prefixCls: string;
    // Motion prop means that there are animations involved
    motion: any;
  };
  // Only works for uncontrolled tree - can maybe remove
  setExpandedKeys: (keys: string[]) => void;
};

export type AnnotationPosition = {
  xVsViewport: number;
  yVsViewport: number;
  visible: boolean;
  scrollContainer?: {
    topVsViewport: number;
    bottomVsViewport: number;
    leftVsViewport: number;
    rightVsViewport: number;
  };
  matchType?: LocationMatch;
  yVsClosestScrollParent?: number;
  xVsClosestScrollParent?: number;
};

export type AnnotationArrowPosition = {
  xVsViewport: number;
  yVsViewport: number;
  withinScroll: boolean;
};

export abstract class BaseAnnotation {
  abstract getPosition(): Promise<AnnotationPosition | null>;
  abstract getMatchType(): Promise<LocationMatch>;
  abstract isOutsideScroll(): Promise<boolean>;
  abstract scrollTo(): Promise<void>;
  abstract getPositionForArrow(): Promise<AnnotationArrowPosition | null>;
}

export type ThirdPartyInstances = {
  monacoEditors: MonacoEditors;
  reactTrees: ReactTrees;
};

export const CORD_INSTANCE_ID_ATTRIBUTE_NAME = 'data-cord-instance-id';
export const containerSelector = (treeID: string) =>
  `[${CORD_INSTANCE_ID_ATTRIBUTE_NAME}="${treeID}"]`;
