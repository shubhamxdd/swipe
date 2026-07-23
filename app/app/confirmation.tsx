import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Music, ExternalLink } from 'lucide-react-native';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';
import { useDeckStore } from '../src/store/deckStore';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { url, name, trackCount } = useLocalSearchParams<{
    url: string;
    name: string;
    trackCount: string;
  }>();
  const reset = useDeckStore((s) => s.reset);

  function handleOpenInSpotify() {
    if (url) {
      Linking.openURL(url);
    }
  }

  function handleBackToHome() {
    reset();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Music size={48} color={colors.accent.primary} />
        </View>

        <Text style={styles.title}>Playlist saved!</Text>
        <Text style={styles.playlistName}>{name || 'Untitled'}</Text>
        <Text style={styles.trackCount}>{trackCount || 0} tracks</Text>

        <TouchableOpacity style={styles.openButton} onPress={handleOpenInSpotify}>
          <ExternalLink size={16} color="#000" />
          <Text style={styles.openButtonText}>Open in Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeButton} onPress={handleBackToHome}>
          <Text style={styles.homeButtonText}>Back to home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  playlistName: {
    ...typography.trackTitle,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  trackCount: {
    ...typography.body,
    color: colors.text.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  openButtonText: {
    ...typography.button,
    color: '#000',
  },
  homeButton: {
    paddingVertical: spacing.md,
  },
  homeButtonText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
