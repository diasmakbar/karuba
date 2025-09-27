export function getPlayerId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_")
}
