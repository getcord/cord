// Scroll positions don't survive the serialization process. We therefore add
// negative margin to the top of the first (non-absolute/fixed/sticky) child of
// each scrollContainer, which acts as the scrollTop. For non-top-level scroll
// containers, we do this in the clone function itself
// TODO - solve horizontal scroll?

export function adjustScrollPositions(
  clonedNode: HTMLElement,
  originalNode: HTMLElement,
) {
  if (originalNode.scrollTop) {
    addScrollAdjuster(clonedNode, originalNode.scrollTop);
  }
  if (originalNode.tagName === 'BODY' && document.documentElement.scrollTop) {
    addScrollAdjuster(clonedNode, document.documentElement.scrollTop);
  }
  // Adjustment means all scrollBar positions will be wrong, so hide them
  hideScrollBars(clonedNode);
  return clonedNode;
}

function hideScrollBars(clonedNode: HTMLElement) {
  const style = document.createElement('style');
  style.innerHTML = `
    *::-webkit-scrollbar {
      width: 0;
    }
    * {
      scrollbar-width: 0;
    }
  `;
  clonedNode.append(style);
}

// Scroll position adjustment happens after css styles are cloned, so we can
// grab styles from inline style objects safely
function addScrollAdjuster(to: HTMLElement, scrollTop: number) {
  const firstNormallyPositionedChild = getFirstNormallyPositionedChild(
    to,
    window,
  );
  if (firstNormallyPositionedChild) {
    const marginTop = parseFloat(
      firstNormallyPositionedChild.style.marginTop || '0',
    );
    firstNormallyPositionedChild.style.marginTop = `${marginTop - scrollTop}px`;
  }
}

export function getFirstNormallyPositionedChild(
  element: HTMLElement,
  containingWindow: Window,
): HTMLElement | undefined {
  const elementStyle = containingWindow.getComputedStyle(element);
  const reverse = elementStyle?.flexDirection.includes('reverse');
  let children = [...element.children];
  if (reverse) {
    children = children.reverse();
  }
  return children.find((child: Element | HTMLElement): child is HTMLElement => {
    const style = getComputedStyle(child);
    return (
      child.nodeName !== 'STYLE' &&
      !['absolute', 'fixed', 'sticky'].includes(style.position)
    );
  });
}
