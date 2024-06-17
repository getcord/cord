const MAX_ZINDEX = 2147483647;

export const ZINDEX = {
  // A full-page modal that sits on top of all the rest of the content
  modal: MAX_ZINDEX,
  // A popup or menu within the sidebar or in the page that should sit on top of
  // neighboring content
  popup: MAX_ZINDEX - 2,
  // Annotation pointers and arrows
  annotation: MAX_ZINDEX - 4,
  // The sidebar itself and associated objects (launcher, etc)
  sidebar: MAX_ZINDEX - 6,
} as const;
