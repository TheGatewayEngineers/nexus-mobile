import {
  exchangeCodeAsync,
  Prompt,
  refreshAsync,
  TokenError,
  TokenResponse,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { apiScope, clientId, issuer, loginScopes, redirectUri, tokenEndpoint } from '@/auth/config';
import { clearRefreshToken, loadRefreshToken, saveRefreshToken } from '@/auth/token-store';

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
  /** True while a saved session is being restored on launch. */
  restoring: boolean;
  /** False until the Entra discovery document and PKCE request are ready. */
  ready: boolean;
  signingIn: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  /**
   * An access token for `scope` (nexus-api by default), refreshed when within 10 minutes of expiry.
   * Throws if signed out, or with a TokenError if Entra refuses (e.g. consent missing for the scope).
   */
  getAccessToken: (scope?: string) => Promise<string>;
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
      // The API scope rides along so Entra collects consent for it here; a refresh can't (AADSTS65001).
      scopes: [...loginScopes, apiScope],
      prompt: Prompt.SelectAccount,
      usePKCE: true,
    },
    discovery
  );

  const [session, setSession] = useState<AuthSession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Latest refresh token plus per-scope access tokens. Entra issues access tokens per resource, so the
  // nexus-api token is a separate refresh from the sign-in tokens.
  const refreshTokenRef = useRef<string | undefined>(undefined);
  const accessTokensRef = useRef(new Map<string, TokenResponse>());
  const pendingRef = useRef(new Map<string, Promise<string>>());
  // Bumped on sign-out so a refresh still in flight can't store tokens afterwards.
  const generationRef = useRef(0);

  const rememberRefreshToken = useCallback(async (refreshToken: string | undefined) => {
    if (!refreshToken) return;
    refreshTokenRef.current = refreshToken;
    await saveRefreshToken(refreshToken);
  }, []);

  // Trade the saved refresh token for a fresh token set. Entra rotates refresh tokens, so save the new one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const refreshToken = await loadRefreshToken();
      if (!refreshToken) return;
      try {
        const tokens = await refreshAsync({ clientId, refreshToken, scopes: loginScopes }, { tokenEndpoint });
        await rememberRefreshToken(tokens.refreshToken ?? refreshToken);
        if (!cancelled) setSession({ user: userFromTokens(tokens), tokens });
      } catch (e) {
        // Entra rejected the token (expired, revoked): forget it. Network errors keep it for the next launch.
        if (e instanceof TokenError) await clearRefreshToken();
      }
    })().finally(() => {
      if (!cancelled) setRestoring(false);
    });
    return () => {
      cancelled = true;
    };
  }, [rememberRefreshToken]);

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
      await rememberRefreshToken(tokens.refreshToken);
      // The code exchange's access token is already for the API scope requested above.
      accessTokensRef.current.set(apiScope, tokens);
      setSession({ user: userFromTokens(tokens), tokens });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setSigningIn(false);
    }
  }, [request, discovery, promptAsync, rememberRefreshToken]);

  // Local sign-out only; the Entra browser session stays, and the account picker shows on next sign in.
  const signOut = useCallback(() => {
    setSession(null);
    generationRef.current += 1;
    refreshTokenRef.current = undefined;
    accessTokensRef.current.clear();
    pendingRef.current.clear();
    void clearRefreshToken();
  }, []);

  const getAccessToken = useCallback(
    async (scope: string = apiScope) => {
      const cached = accessTokensRef.current.get(scope);
      if (cached && TokenResponse.isTokenFresh(cached)) return cached.accessToken;

      // Share one in-flight refresh between concurrent callers.
      const pending = pendingRef.current.get(scope);
      if (pending) return pending;

      const refreshToken = refreshTokenRef.current;
      if (!refreshToken) throw new Error('Not signed in.');

      const generation = generationRef.current;
      const promise = (async () => {
        try {
          const tokens = await refreshAsync(
            { clientId, refreshToken, scopes: [scope, 'offline_access'] },
            { tokenEndpoint }
          );
          if (generation !== generationRef.current) throw new Error('Signed out.');
          accessTokensRef.current.set(scope, tokens);
          await rememberRefreshToken(tokens.refreshToken);
          return tokens.accessToken;
        } finally {
          if (generation === generationRef.current) pendingRef.current.delete(scope);
        }
      })();
      pendingRef.current.set(scope, promise);
      return promise;
    },
    [rememberRefreshToken]
  );

  const value = useMemo(
    () => ({
      session,
      restoring,
      ready: !!request && !!discovery,
      signingIn,
      error,
      signIn,
      signOut,
      getAccessToken,
    }),
    [session, restoring, request, discovery, signingIn, error, signIn, signOut, getAccessToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
