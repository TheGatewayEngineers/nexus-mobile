import {
  exchangeCodeAsync,
  Prompt,
  useAuthRequest,
  useAutoDiscovery,
  type TokenResponse,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { clientId, issuer, loginScopes, redirectUri } from '@/auth/config';

// Closes the auth popup on web once Entra redirects back.
WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  name?: string;
  email?: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: TokenResponse;
};

type AuthContextValue = {
  session: AuthSession | null;
  /** False until the Entra discovery document and PKCE request are ready. */
  ready: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Reads the claims out of an ID token. Entra already validated it; we only need the profile. */
function decodeIdToken(idToken: string): Record<string, unknown> {
  const base64 = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const json = decodeURIComponent(
    Array.from(binary, (c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(json);
}

function userFromTokens(tokens: TokenResponse): AuthUser {
  const claims = tokens.idToken ? decodeIdToken(tokens.idToken) : {};
  return {
    id: String(claims.oid ?? claims.sub ?? ''),
    name: claims.name as string | undefined,
    email: (claims.preferred_username ?? claims.email) as string | undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const discovery = useAutoDiscovery(issuer);
  const [request, , promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: loginScopes,
      prompt: Prompt.SelectAccount,
      usePKCE: true,
    },
    discovery
  );

  const [session, setSession] = useState<AuthSession | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (!request || !discovery) return;
    setSigningIn(true);
    setError(null);
    try {
      const result = await promptAsync();
      if (result.type === 'error') {
        setError(result.params.error_description ?? result.error?.message ?? 'Sign in failed.');
        return;
      }
      if (result.type !== 'success') return; // user cancelled or dismissed the browser

      const tokens = await exchangeCodeAsync(
        {
          clientId,
          redirectUri,
          code: result.params.code,
          extraParams: { code_verifier: request.codeVerifier ?? '' },
        },
        discovery
      );
      setSession({ user: userFromTokens(tokens), tokens });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setSigningIn(false);
    }
  }, [request, discovery, promptAsync]);

  // Local sign-out only; the Entra browser session stays, and the account picker shows on next sign in.
  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({ session, ready: !!request && !!discovery, signingIn, error, signIn, signOut }),
    [session, request, discovery, signingIn, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
