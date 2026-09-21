export function getHealth(): { status: 'ok'; uptime: number } {
  return { status: 'ok', uptime: process.uptime() };
}
