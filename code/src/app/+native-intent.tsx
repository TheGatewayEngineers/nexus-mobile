/**
 * Keeps the router out of the nexusmobile://auth sign-in redirect. expo-auth-session reads the code from
 * the URL itself; if the router also navigates to /auth, its <Redirect> races the auth guards flipping
 * and the navigation tree loops ("Maximum update depth exceeded").
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    const { hostname, pathname } = new URL(path, 'nexusmobile://');
    const isAuthRedirect = hostname === 'auth' || pathname.replace(/^\/+/, '').startsWith('auth');
    if (isAuthRedirect) {
      // Cold start from a stale redirect: land on "/" and let the guards pick the screen.
      return initial ? '/' : null;
    }
    return path;
  } catch {
    return '/';
  }
}
