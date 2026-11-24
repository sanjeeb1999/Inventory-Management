export function formatQuantityChange(change: number): string {
  if (change > 0) return `+${change}`
  return `${change}`
}
