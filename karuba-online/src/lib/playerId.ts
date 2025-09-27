export function getPlayerId(name: string = "player"): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_")
}
