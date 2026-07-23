// Grows a textarea to fit its content instead of scrolling internally --
// used by the Add/Edit Scripture boxes. Plain height-reset-then-measure, no ResizeObserver
// needed since it's only ever called from a value-change effect.
export function autosizeTextarea(el: HTMLTextAreaElement | null): void {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}
