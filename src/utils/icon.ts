export function icon(iconName: string, viewBoxSize: number = 24): string {
  return `<svg class="transifex-js-icon transifex-js-icon-${iconName}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" aria-hidden="true"><path /></svg>`;
}
