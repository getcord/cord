import type { DocumentLocation } from 'common/types/index.ts';
import { ElementIdentifierMatch, LocationMatch } from 'common/types/index.ts';
import { assert } from 'common/util/index.ts';
import type { BaseAnnotation } from 'external/src/delegate/annotations/types.ts';
import type { ReactTree } from 'external/src/delegate/annotations/ReactTrees.ts';
import { matchElementIdentity } from 'external/src/delegate/location/elementIdentifier/index.ts';

type AnnotationArgs = {
  location: DocumentLocation;
  tree: ReactTree | null;
};

export class ReactTreeAnnotation implements BaseAnnotation {
  private location;
  private tree;
  private hasUniqueSelector: boolean;
  private treeNodeKey: string;

  constructor({ location, tree }: AnnotationArgs) {
    this.location = location;
    this.tree = tree;
    assert(
      !!location.additionalTargetData?.reactTree,
      'Annotation not made in reactTree',
    );
    this.treeNodeKey = location.additionalTargetData.reactTree.key;
    // For Salto, only the node label (fileName) has a unique selector
    this.hasUniqueSelector = Boolean(
      location.selector.includes(this.treeNodeKey),
    );
  }

  async getPosition() {
    let target: Element | null = null;
    if (!this.hasUniqueSelector && !this.tree) {
      return null;
    }
    if (
      this.tree &&
      (!this.tree.isVisible() || !this.tree.isNodeInTree(this.treeNodeKey))
    ) {
      return null;
    }
    target = this.tree
      ? this.tree.getVisibleTreeNode(this.treeNodeKey)
      : this.hasUniqueSelector
      ? document.querySelector(this.location.selector)
      : null;

    if (!target) {
      // Node is not present on screen
      return {
        visible: false,
        target,
        // These are dud values. If we have access to the tree, we'll point the
        // arrow to getPositionForArrow
        xVsViewport: 0,
        yVsViewport: 0,
      };
    }
    const targetRect = target.getBoundingClientRect();
    const xVsViewport = targetRect.x + this.location.x * targetRect.width;
    const yVsViewport = targetRect.y + this.location.y * targetRect.height;
    return {
      xVsViewport,
      yVsViewport,
      visible: true,
      target,
    };
  }

  async getMatchType() {
    const position = await this.getPosition();
    if (!position) {
      return LocationMatch.NONE;
    }
    const target = position.target;
    if (!target) {
      return this.tree
        ? LocationMatch.OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST
        : LocationMatch.OUTSIDE_INACCESSIBLE_VIRTUALISED_LIST;
    }
    const matchType = matchElementIdentity(
      target,
      this.location.elementIdentifier?.identifier,
      this.location.elementIdentifier?.version,
    );
    return matchType === ElementIdentifierMatch.EXACT
      ? LocationMatch.EXACT
      : LocationMatch.STALE;
  }

  async isOutsideScroll() {
    const matchType = await this.getMatchType();
    return matchType === LocationMatch.OUTSIDE_ACCESSIBLE_VIRTUALISED_LIST;
  }

  async scrollTo() {
    if (!this.tree) {
      return;
    }
    await this.tree.scrollToKey(this.treeNodeKey);
  }

  // 3 out-of-view possibilities: above/below scroll and in collapsed node
  async getPositionForArrow() {
    const position = await this.getPosition();
    if (!position) {
      return null;
    }
    if (position.visible) {
      return {
        xVsViewport: position.xVsViewport,
        yVsViewport: position.yVsViewport,
        withinScroll: true,
      };
    }
    if (!this.tree) {
      return null;
    }
    let key = this.treeNodeKey;
    const ancestors = this.tree.getAncestors(this.treeNodeKey);
    if (!ancestors) {
      return null;
    }
    const expanded = ancestors.every((ancestor) =>
      // Todo - why is '!' necessary here given type guard above
      this.tree!.isNodeExpanded(ancestor.key),
    );
    if (!expanded) {
      const firstNonExpandedAncestor = ancestors.find(
        (ancestor) => !this.tree!.isNodeExpanded(ancestor.key),
      );
      key = firstNonExpandedAncestor!.key;
      const visibleNode = this.tree.getVisibleTreeNode(key);
      if (visibleNode) {
        const nodeRect = visibleNode.getBoundingClientRect();
        return {
          xVsViewport: nodeRect.left + nodeRect.width / 2,
          yVsViewport: nodeRect.top + nodeRect.height / 2,
          withinScroll: true,
        };
      }
    }
    const nodePosition = this.tree.getNodePositionVsScroll(key);
    if (nodePosition === 'notPresent') {
      return null;
    }
    const arrowGoingDown = nodePosition === 'below';
    const { outerContainer } = this.tree;
    const rect = outerContainer.getBoundingClientRect()!;
    return {
      xVsViewport: rect.left + rect.width / 2,
      yVsViewport: arrowGoingDown ? rect.bottom : rect.top,
      withinScroll: false,
    };
  }
}
