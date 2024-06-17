import { Colors } from 'common/const/Colors.ts';
import { StyleCloner } from 'external/src/lib/nativeScreenshot/elementCloner/StyleCloner.ts';
import { Sizes } from 'common/const/Sizes.ts';

const TITLE = 'Content not available';
const TITLE_MIN_WIDTH = 150;
const TITLE_MIN_HEIGHT = 20;
const SUBTITLE = "It's hosted on another page";
const SUBTITLE_MIN_WIDTH = 200;
const SUBTITLE_MIN_HEIGHT = 40;

export function getContentNotAvailablePlaceholder(
  nodeToReplace: HTMLElement | SVGElement,
) {
  const styleCloner = new StyleCloner({
    nativeNode: nodeToReplace,
    containingWindow: window,
    containingDocument: document,
  });
  const placeholderDiv = document.createElement('div');
  styleCloner.decorate(placeholderDiv);
  if (placeholderDiv.style.display === 'inline') {
    // Change to inline-block so it respects its width and height
    placeholderDiv.style.display = 'inline-block';
  }
  if (styleCloner.offScreen) {
    return placeholderDiv;
  }

  const rect = nodeToReplace.getBoundingClientRect();
  placeholderDiv.style.backgroundColor = Colors.GREY_X_LIGHT;
  if (rect.width > TITLE_MIN_WIDTH && rect.height > TITLE_MIN_HEIGHT) {
    placeholderDiv.style.display = placeholderDiv.style.display.includes(
      'inline',
    )
      ? 'inline-flex'
      : 'flex';
    placeholderDiv.style.flexDirection = 'column';
    placeholderDiv.style.justifyContent = 'center';
    placeholderDiv.style.alignItems = 'center';
    const title = document.createElement('div');
    title.innerText = TITLE;
    title.style.color = Colors.GREY_DARK;

    const textDivs = [title];
    if (rect.width > SUBTITLE_MIN_WIDTH && rect.height > SUBTITLE_MIN_HEIGHT) {
      const subtitle = document.createElement('div');
      subtitle.innerText = SUBTITLE;
      subtitle.style.color = Colors.GREY;
      textDivs.push(subtitle);
    }
    for (const div of textDivs) {
      div.style.fontSize = `${Sizes.DEFAULT_TEXT_SIZE_PX}px`;
      div.style.fontFamily = `Helvetica, Arial, sans-serif`;
      div.style.letterSpacing = '0.2px';
      placeholderDiv.appendChild(div);
    }
  }
  return placeholderDiv;
}
