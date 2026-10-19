import { Redirect } from 'expo-router';

/**
 * Landing spot for the nexusmobile://auth redirect. expo-auth-session reads the code from the URL;
 * if the router sees the deep link too, bounce to "/" and the auth guards pick the right screen.
 */
export default function AuthRedirect() {
  return <Redirect href="/" />;
}
