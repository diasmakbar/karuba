export function getPlayerId(): string {
  let pid = localStorage.getItem("karubaPlayerId")
  if (!pid) {
    pid = crypto.randomUUID()
    localStorage.setItem("karubaPlayerId", pid)
  }
  return pid
}
