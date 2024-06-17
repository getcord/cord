import { getTransformValues } from 'external/src/delegate/util.ts';
import { classContains } from 'external/src/lib/cssSelectors.ts';
import { isHidden } from 'external/src/delegate/location/findTarget.ts';
import type { ReactTreeInstance } from 'external/src/delegate/annotations/types.ts';
import {
  containerSelector,
  CORD_INSTANCE_ID_ATTRIBUTE_NAME,
} from 'external/src/delegate/annotations/types.ts';
import { findLastIndex } from '@cord-sdk/react/common/lib/findLast.ts';
import sleep from 'common/util/sleep.ts';

// ClassName suffixes:
const TREE_SUFFIX = '-list';
const TREE_FIRST_CHILD_SUFFIX = '-list-holder';
const TREE_NODE_CONTAINER_SUFFIX = '-list-holder-inner';
const TREE_NODE_SUFFIX = '-treenode';
const SWITCHER_SUFFIX = '-switcher';

export class ReactTrees {
  treeInstances: Map<string, ReactTreeInstance> = new Map<
    string,
    ReactTreeInstance
  >();

  addTreeInstance(id: string, treeInstance: ReactTreeInstance) {
    this.treeInstances.set(id, treeInstance);
  }

  removeTreeInstance(id: string) {
    this.treeInstances.delete(id);
  }

  getReactTree(treeID: string | null) {
    if (!treeID) {
      return null;
    }
    const instance = this.treeInstances.get(treeID);
    return instance ? createReactTree(treeID, instance) : null;
  }

  getReactTreeElement(element: Element) {
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const includesClassEndingWith = (element: Element, endsWith: string) =>
      [...element.classList].some((className) => className.endsWith(endsWith));
    let treeNodeContainerMatch = false;
    let treeMatch = false;
    let parent = element.parentElement;
    while (parent) {
      if (!treeNodeContainerMatch) {
        // First match treeNodeContainer
        treeNodeContainerMatch = includesClassEndingWith(
          parent,
          TREE_NODE_CONTAINER_SUFFIX,
        );
      } else {
        // Then check for tree > treeFirstChild, and sibling of tree
        treeMatch = Boolean(
          includesClassEndingWith(parent, TREE_FIRST_CHILD_SUFFIX) &&
            parent.parentElement &&
            includesClassEndingWith(parent.parentElement, TREE_SUFFIX) &&
            parent.parentElement.previousElementSibling?.getAttribute(
              'role',
            ) === 'tree',
        );
        if (treeMatch) {
          return parent.parentElement;
        }
      }
      parent = parent.parentElement;
    }
    return null;
  }

  isElementInReactTree(element: Element) {
    return Boolean(this.getReactTreeElement(element));
  }

  getTargetData(target: Element) {
    const treeNodeElement = target.closest(classContains(TREE_NODE_SUFFIX));
    const fallback = {
      // Salto puts the unique node key inside `data-cy` on node title
      // If we don't have access to tree, we should use this
      target: treeNodeElement?.querySelector('[data-cy]') ?? null,
      additionalTargetData: {
        targetType: 'reactTree' as const,
        monacoEditor: null,
        reactTree: null,
        konvaCanvas: null,
      },
    };
    if (!treeNodeElement) {
      return fallback;
    }
    try {
      const treeElement = this.getReactTreeElement(target);
      const treeID = treeElement?.getAttribute(CORD_INSTANCE_ID_ATTRIBUTE_NAME);
      if (!treeElement || !treeID) {
        return fallback;
      }
      const tree = this.getReactTree(treeID);
      if (!tree) {
        return fallback;
      }
      const { start, end } = tree.getRenderedItemRange();
      const nodeData = tree.getFlattenedNodes().slice(start, end)[
        tree.getIndexOfNode(treeNodeElement)
      ];
      if (nodeData?.key) {
        return {
          target: treeNodeElement,
          additionalTargetData: {
            targetType: 'reactTree' as const,
            monacoEditor: null,
            konvaCanvas: null,
            reactTree: {
              key: nodeData.key,
              treeID,
            },
          },
        };
      }
      return fallback;
    } catch (error) {
      console.warn(error);
      return fallback;
    }
  }
}

function createReactTree(treeID: string, treeInstance: ReactTreeInstance) {
  const container = document.querySelector(containerSelector(treeID));
  const treeNodeContainer = document.querySelector(
    `${containerSelector(treeID)} ${classContains(TREE_NODE_CONTAINER_SUFFIX)}`,
  );
  if (!container || !treeNodeContainer) {
    return null;
  }
  return new ReactTree(treeInstance, container, treeNodeContainer);
}

export class ReactTree {
  private treeInstance: ReactTreeInstance;
  outerContainer: Element;
  private treeNodeContainer: Element;

  constructor(
    treeInstance: ReactTreeInstance,
    outerContainer: Element,
    treeNodeContainer: Element,
  ) {
    this.treeInstance = treeInstance;
    this.outerContainer = outerContainer;
    this.treeNodeContainer = treeNodeContainer;
  }

  isVisible() {
    return !isHidden(this.outerContainer);
  }

  getFlattenedNodes() {
    return this.treeInstance.state.flattenNodes;
  }

  getRenderedItemRange() {
    const treeNodes = [...this.treeNodeContainer.children];
    const nodeHeight = parseFloat(getComputedStyle(treeNodes[0]).height);
    const containerTranslateY = getTransformValues(
      getComputedStyle(this.treeNodeContainer),
    ).translateY;
    const firstItemIndex = containerTranslateY / nodeHeight;
    return {
      start: firstItemIndex,
      end: firstItemIndex + treeNodes.length,
    };
  }

  getIndexOfNode(treeNodeElement: Element) {
    return [...this.treeNodeContainer.children].indexOf(treeNodeElement);
  }

  getVisibleTreeNode(key: string) {
    const { start, end } = this.getRenderedItemRange();
    const renderedItems = this.getFlattenedNodes().slice(start, end);
    const index = renderedItems.findIndex((item) => item.key === key);
    const node = this.treeNodeContainer.children[index];
    if (!node || !this.isNodeElementVisible(node)) {
      return null;
    }
    return node;
  }

  getVisibleItemRange() {
    const treeNodes = [...this.treeNodeContainer.children];
    const firstVisibleIndex = treeNodes.findIndex((node) =>
      this.isNodeElementVisible(node),
    );
    const lastVisibleIndex = findLastIndex(treeNodes, (node) =>
      this.isNodeElementVisible(node),
    );
    const renderedItemRange = this.getRenderedItemRange();

    return {
      start: firstVisibleIndex + renderedItemRange.start,
      end: lastVisibleIndex + 1 + renderedItemRange.start,
    };
  }

  getNodePositionVsScroll(key: string) {
    const { start, end } = this.getVisibleItemRange();
    const nodeIndex = this.getFlattenedNodes().findIndex(
      (expandedNode) => expandedNode.key === key,
    );
    if (nodeIndex === -1) {
      return 'notPresent';
    }
    if (nodeIndex < start) {
      return 'above';
    }
    if (nodeIndex < end) {
      return 'withinScroll';
    }
    return 'below';
  }

  getAncestors(key: string) {
    const keyEntities = Object.values(this.treeInstance.state.keyEntities);
    const index = keyEntities.findIndex(
      (expandedNode) => expandedNode.key === key,
    );
    if (index === -1) {
      return null;
    }
    const entity = keyEntities[index];
    const ancestors: typeof keyEntities = [];
    let level = entity.level;
    // Pos is the node's index prefixed by each ancestor's index (separated by hyphens)
    // Examples: '0' / '0-0' / '0-1' / '0-0-1'
    let pos = entity.pos;
    for (let i = index - 1; i >= 0; i--) {
      const node = keyEntities[i];
      if (
        node.level >= level ||
        !pos.startsWith(node.pos) ||
        // Ignore key just there for animation
        node.key.includes('RC_TREE_MOTION')
      ) {
        continue;
      }
      ancestors.unshift(node);
      level = node.level;
      pos = node.pos;
    }
    return ancestors;
  }

  isNodeExpanded(key: string) {
    return this.treeInstance.state.expandedKeys.includes(key);
  }

  isNodeInTree(key: string) {
    return Object.keys(this.treeInstance.state.keyEntities).includes(key);
  }

  async scrollToKey(key: string) {
    const animated = Boolean(this.treeInstance.props.motion);
    // 400ms tested on lib's animated example, 100ms tested on Salto (not animated)
    const delayInMS = animated ? 400 : 100;
    const ancestors = this.getAncestors(key);
    if (!ancestors) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    const keysToExpand = ancestors.map(({ key }) => key);
    // eslint-disable-next-line @typescript-eslint/no-shadow -- Disabling for pre-existing problems. Please do not copy this comment, and consider fixing this one!
    for (const key of keysToExpand) {
      if (this.isNodeExpanded(key)) {
        continue;
      }
      let node = this.getVisibleTreeNode(key);
      if (!node) {
        this.treeInstance.scrollTo({ key });
        await sleep(delayInMS);
      }
      node = this.getVisibleTreeNode(key);
      if (node) {
        this.expandTreeNode(node);
        await sleep(delayInMS);
      }
    }
    this.treeInstance.scrollTo({ key });
    await sleep(delayInMS);
  }

  private isNodeElementVisible(node: Element) {
    const outerContainerRect = this.outerContainer.getBoundingClientRect();
    if (outerContainerRect.width === 0 && outerContainerRect.height === 0) {
      // Tree is not visible on page
      return false;
    }
    const nodeRect = node.getBoundingClientRect();
    return (
      nodeRect.top >= outerContainerRect.top &&
      nodeRect.bottom <= outerContainerRect.bottom
    );
  }

  private expandTreeNode(node: Element) {
    const switcher = node.querySelector(classContains(SWITCHER_SUFFIX));
    if (switcher) {
      // Sometimes click listener is on an svg child inside the treeSwitcher element
      const svgChild = [...switcher.children].find(
        (child) => child.tagName === 'svg',
      );
      const target = svgChild ?? switcher;
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(clickEvent);
    }
  }
}
