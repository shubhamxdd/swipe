import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, ExternalLink, RotateCcw } from 'lucide-react-native';
import { useDeckStore } from '../store/deckStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { url, name } = useLocalSearchParams<{ url: string; name: string }>();
  const reset = useDeckStore((s) => s.reset);

  const playlistUrl = url ? decodeURIComponent(url) : '';
  const playlistName = name ? decodeURIComponent(name) : 'Playlist';

  function handleOpen() {
    if (playlistUrl) {
      Linking.openURL(playlistUrl);
    }
  }

  function handleNewMix() {
    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <CheckCircle size={64} color={colors.accent.primary} />
        <Text style={styles.title}>Playlist Saved!</Text>
        <Text style={styles.subtitle}>
          &ldquo;{playlistName}&rdquo; is now in your Spotify library.
        </Text>

        <TouchableOpacity style={styles.openButton} onPress={handleOpen}>
          <ExternalLink size={20} color="#fff" />
          <Text style={styles.openText}>Open in Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.newButton} onPress={handleNewMix}>
          <RotateCcw size={20} color={colors.accent.primary} />
          <Text style={styles.newText}>Create New Mix</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: '100%',
  },
  openText: {
    ...typography.button,
    color: '#fff',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: '100%',
  },
  newText: {
    ...typography.button,
    color: colors.accent.primary,
  },
});
