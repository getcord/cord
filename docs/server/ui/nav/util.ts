export default function normalizePath(pathname: string) {
  return pathname === '/' ? '/get-started' : pathname;
}
