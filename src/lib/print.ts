/**
 * Printing. Whatever the visitor's theme, a print is the daylight rendition: the theme switches
 * to light just before the browser lays out the print and switches back after. And every
 * document marked [data-print-fit] prints on one sheet: it is measured at the sheet's printable
 * width and, only if it would run past one page, scaled down until it fits (CSS zoom). Documents
 * also tighten their rows as they grow (`printDensity`), so scaling is the last resort for an
 * unusually long list, not the way ordinary ones fit.
 *
 * Sheet sizes match the @page rules in index.css: A4 portrait less 12mm sides and 14mm top and
 * bottom, A4 landscape less 10mm all round.
 */
const MM = 96 / 25.4;
const SHEETS = {
  portrait: { w: 186 * MM, h: 269 * MM },
  landscape: { w: 277 * MM, h: 190 * MM },
};

/** Row counts at which a document's tables tighten (see .doc[data-density] in components.css). */
export function printDensity(rows: number): "normal" | "compact" | "tight" {
  return rows <= 10 ? "normal" : rows <= 18 ? "compact" : "tight";
}

let themeBeforePrint: string | undefined;

function beforePrint() {
  const root = document.documentElement;
  themeBeforePrint = root.dataset.theme;
  root.dataset.theme = "light";
  // .measuring applies the print styles that shape a document, so it's measured as it will print;
  // it comes off again before anything paints
  root.classList.add("measuring");
  for (const el of document.querySelectorAll<HTMLElement>("[data-print-fit]")) fit(el);
  root.classList.remove("measuring");
}

/**
 * Scale a document down until it fits one sheet, as little as possible. A scaled document is laid
 * out wider (the sheet's width divided by the scale) so it still spans the page, which wraps its
 * text less; and scaling rounds hairlines and line heights up. So every scale is measured, not
 * computed: find one that fits, then search between it and the last that didn't for the largest.
 */
function fit(el: HTMLElement) {
  const sheet = SHEETS[el.dataset.printFit === "landscape" ? "landscape" : "portrait"];
  const room = sheet.h - 4; // a few pixels for rounding in the print engine
  const fits = (zoom: number) => {
    el.style.zoom = zoom === 1 ? "" : String(zoom);
    el.style.width = `${sheet.w / zoom}px`;
    return el.getBoundingClientRect().height <= room; // scaled size, as it will print
  };
  if (fits(1)) {
    el.style.width = "";
    return;
  }
  let tooBig = 1;
  let ok = room / el.getBoundingClientRect().height;
  for (let i = 0; i < 8 && !fits(ok); i++) {
    tooBig = ok;
    ok *= 0.97;
  }
  for (let i = 0; i < 7; i++) {
    const mid = (ok + tooBig) / 2;
    if (fits(mid)) ok = mid;
    else tooBig = mid;
  }
  fits(ok);
}

function afterPrint() {
  const root = document.documentElement;
  if (themeBeforePrint) root.dataset.theme = themeBeforePrint;
  for (const el of document.querySelectorAll<HTMLElement>("[data-print-fit]")) {
    el.style.zoom = "";
    el.style.width = "";
  }
}

export function installPrint() {
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
}
