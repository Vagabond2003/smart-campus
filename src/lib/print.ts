/**
 * Printing. Whatever the visitor's theme, a print is the daylight rendition. And every document
 * marked [data-print-fit] prints on one page, whatever paper, orientation and margins the print
 * dialog ends up with (iOS lets you flip orientation inside the dialog, and Safari adds its own
 * header and footer).
 *
 * How it fits: a document is laid out at a fixed design width in rem (44 for portrait papers, 66
 * for the landscape routines), and its height is measured here as `a` rem plus `b` px (hairlines
 * don't scale). The print stylesheet (index.css) then sizes the page's rem so that box fits the
 * page area both ways, using vw and vh, which are the page area when printing. So the fit is
 * worked out by the browser at print time, against the real page, and follows any change made in
 * the dialog. Documents also tighten their rows as they grow (`printDensity`), so long lists
 * stay as large as they can.
 */
const DESIGN_WIDTH = { portrait: 44, landscape: 66 };

/** Row counts at which a document's tables tighten (see .doc[data-density] in components.css). */
export function printDensity(rows: number): "normal" | "compact" | "tight" {
  return rows <= 10 ? "normal" : rows <= 18 ? "compact" : "tight";
}

let themeBeforePrint: string | undefined;
let printing = false;

/** Height of `el` laid out `width` rem wide, with the page's rem at `px`. */
function heightAt(el: HTMLElement, width: number, px: number) {
  document.documentElement.style.fontSize = `${px}px`;
  el.style.width = `${width}rem`;
  return el.getBoundingClientRect().height;
}

function measure() {
  const root = document.documentElement;
  // .measuring applies the print styles that shape a document; it comes off before anything paints
  root.classList.add("measuring");
  const keep = root.style.fontSize;
  for (const el of document.querySelectorAll<HTMLElement>("[data-print-fit]")) {
    const width = DESIGN_WIDTH[el.dataset.printFit === "landscape" ? "landscape" : "portrait"];
    // two sizes give the rem part and the fixed (hairline) part of the height
    const big = heightAt(el, width, 16);
    const small = heightAt(el, width, 8);
    el.style.width = "";
    const a = Math.max((big - small) / 8, 1);
    const b = Math.max(big - a * 16, 0);
    root.style.setProperty("--print-w", String(width));
    root.style.setProperty("--print-a", a.toFixed(3));
    root.style.setProperty("--print-b", b.toFixed(1));
  }
  root.style.fontSize = keep;
  root.classList.remove("measuring");
}

/** Light theme and a fresh measurement; safe to call more than once before a print. */
export function preparePrint() {
  const root = document.documentElement;
  if (!printing) {
    themeBeforePrint = root.dataset.theme;
    printing = true;
  }
  root.dataset.theme = "light";
  measure();
}

function finishPrint() {
  if (!printing) return;
  printing = false;
  if (themeBeforePrint) document.documentElement.dataset.theme = themeBeforePrint;
}

/** For the "Print or save PDF" buttons: prepare first, so it's right even where beforeprint is late. */
export function printPage() {
  preparePrint();
  window.print();
}

export function installPrint() {
  window.addEventListener("beforeprint", preparePrint);
  window.addEventListener("afterprint", finishPrint);
  // Safari also reports printing through the print media query
  window.matchMedia("print").addEventListener("change", (e) => {
    if (e.matches && !printing) preparePrint();
    else if (!e.matches) finishPrint();
  });
}
