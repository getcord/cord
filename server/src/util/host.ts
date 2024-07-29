export function extractHostname(host: string | undefined): string | null {
  if (typeof host === 'string') {
    const hostnameMatch = host.match(/^([^\/:]+)(?::\d+)?/);
    return hostnameMatch ? hostnameMatch[1] : null;
  } else {
    return null;
  }
}
