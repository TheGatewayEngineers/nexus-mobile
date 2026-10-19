import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Brand, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  const { ready, signingIn, error, signIn } = useAuth();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <Logo variant="wordmark" color="default-white" scheme="dark" width={Math.min(width - Spacing.six, 320)} />
          <View style={styles.welcome}>
            <Text style={styles.title}>Welcome to Nexus</Text>
            <Text style={styles.subtitle}>Sign in with your Gateway account to get started.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            variant="primary"
            appearance="solid"
            size="lg"
            scheme="dark"
            iconLeft="right-to-bracket"
            working={signingIn}
            disabled={!ready}
            onPress={signIn}
            style={styles.signIn}>
            Sign In
          </Button>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.navy,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  welcome: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    color: Brand.white,
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    color: Brand.graysky,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.three,
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  signIn: {
    alignSelf: 'stretch',
  },
  error: {
    color: Brand.clay,
    textAlign: 'center',
  },
});
