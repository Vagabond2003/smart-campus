import { CREST, CREST_VIEWBOX, type CrestShape } from "./crestArt";

/**
 * The BAUST crest as separately animatable parts, painted bottom to top in the source's order.
 * The pulse line is revealed through a clip rectangle the intro widens from left to right.
 */
export function IntroCrest({ className }: { className?: string }) {
  const parts = Object.entries(CREST) as [keyof typeof CREST, CrestShape[]][];
  return (
    <svg viewBox={CREST_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="intro-pulse-wipe">
          <rect data-wipe x="350" y="240" width="0" height="220" />
        </clipPath>
      </defs>
      {parts.map(([part, shapes]) => (
        <g key={part} data-part={part} clipPath={part === "pulse" ? "url(#intro-pulse-wipe)" : undefined}>
          {shapes.map((s, i) => (
            <path key={i} fill={s.fill} fillRule="evenodd" d={s.d} />
          ))}
        </g>
      ))}
    </svg>
  );
}
