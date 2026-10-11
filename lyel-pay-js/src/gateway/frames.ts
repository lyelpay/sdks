const MODAL_LAYER = '2147483000';
/** Shows the loading skeleton until the widget announces its real height. */
const INITIAL_BLOCK_HEIGHT = '400px';

function baseFrame(src: string, title: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title;
  Object.assign(iframe.style, { border: '0', background: 'transparent', colorScheme: 'normal', display: 'block' });
  return iframe;
}

/** Mode A: the widget draws the backdrop and the dialog itself, so the frame covers the viewport, transparent. */
export function createModalFrame(src: string): HTMLIFrameElement {
  const iframe = baseFrame(src, 'Lyel Pay');
  Object.assign(iframe.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: MODAL_LAYER,
  });
  return iframe;
}

/** Mode B: as wide as its container (320 to 560 px); the height follows the widget `resize` messages. */
export function createEmbeddedFrame(src: string): HTMLIFrameElement {
  const iframe = baseFrame(src, 'Lyel Pay');
  Object.assign(iframe.style, { width: '100%', minWidth: '320px', maxWidth: '560px', height: INITIAL_BLOCK_HEIGHT });
  return iframe;
}
