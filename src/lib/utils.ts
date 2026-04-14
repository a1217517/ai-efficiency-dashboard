export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}w`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toLocaleString()
}

export function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`
}
