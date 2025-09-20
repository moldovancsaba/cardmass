// Color helpers for dynamic backgrounds (from upstream)
export type RGB = { r: number; g: number; b: number }

export function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  if (normalized.length === 6) {
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }
  const r = (bigint >> 8) & 15
  const g = (bigint >> 4) & 15
  const b = bigint & 15
  return { r: (r << 4) | r, g: (g << 4) | g, b: (b << 4) | b }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(Math.max(0, Math.min(255, Math.round(r))))}${toHex(
    Math.max(0, Math.min(255, Math.round(g)))
  )}${toHex(Math.max(0, Math.min(255, Math.round(b))))}`
}

export function interpolateColor(startHex: string, endHex: string, t: number): string {
  const a = hexToRgb(startHex)
  const b = hexToRgb(endHex)
  const clamped = Math.max(0, Math.min(1, t))
  const mix = (x: number, y: number) => x + (y - x) * clamped
  return rgbToHex({ r: mix(a.r, b.r), g: mix(a.g, b.g), b: mix(a.b, b.b) })
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`
}