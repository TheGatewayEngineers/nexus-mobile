import { makeRedirectUri } from 'expo-auth-session';

/**
 * Microsoft Entra ID settings — same tenant and app registration as nexus-web (src/auth/msalConfig.ts).
 * Values come from .env (EXPO_PUBLIC_* vars are inlined at build time).
 */
export const clientId = process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID as string;
export const tenantId = process.env.EXPO_PUBLIC_ENTRA_TENANT_ID as string;
export const apiAppId = process.env.EXPO_PUBLIC_ENTRA_APIAPP_ID as string;

/** OIDC issuer; expo-auth-session fetches the authorize/token endpoints from its discovery document. */
export const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

/**
 * nexusmobile://auth in a development/production build (scheme from app.json).
 * This exact value must be registered on the Entra app under "Mobile and desktop applications".
 */
export const redirectUri = makeRedirectUri({ scheme: 'nexusmobile', path: 'auth' });

/** offline_access gets a refresh token so we can renew without re-prompting later. */
export const loginScopes = ['openid', 'profile', 'email', 'offline_access'];

/** Token scope for calling nexus-api (matches apiTokenRequest in nexus-web). Not requested yet. */
export const apiScope = `api://${apiAppId}/api.access`;
