/**
 * Mode A takes the page over: no scroll behind the modal, and the keyboard focus goes into the checkout.
 * The returned function gives both back, focus to the element that opened the checkout.
 */
export function takeOverPage(): () => void {
  const previousOverflow = document.body.style.overflow;
  const previousFocus = document.activeElement;
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = previousOverflow;
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  };
}
