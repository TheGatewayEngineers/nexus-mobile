import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Brand, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const user = session?.user;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <FontAwesome6 name="circle-check" solid size={56} color={Brand.headerSage} />
        <ThemedText type="subtitle" style={styles.center}>
          You&apos;re signed in
        </ThemedText>
        {user?.name && <ThemedText style={styles.center}>{user.name}</ThemedText>}
        {user?.email && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {user.email}
          </ThemedText>
        )}
        <Button variant="default" appearance="outline" iconLeft="right-from-bracket" onPress={signOut} style={styles.signOut}>
          Sign Out
        </Button>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  center: {
    textAlign: 'center',
  },
  signOut: {
    alignSelf: 'center',
    marginTop: Spacing.four,
  },
});
