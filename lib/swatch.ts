// A single color renders as a solid fill; 2-4 render as an even pie split
// (conic-gradient), so a multi-color edition (e.g. gold + pink) reads as one
// swatch instead of picking just one color to represent it.
export function swatchBackground(colors: string[]): string {
  const list = colors.length ? colors : ["#e5e5e5"];
  if (list.length === 1) return list[0];
  const slice = 360 / list.length;
  const stops = list.map((c, i) => `${c} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ");
  return `conic-gradient(${stops})`;
}
