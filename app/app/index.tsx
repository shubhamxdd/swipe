import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Music, History } from 'lucide-react-native';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';
import { useAuthStore } from '../src/store/authStore';
import { useDeckStore } from '../src/store/deckStore';
import { submitTheme } from '../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_THEMES_KEY = 'swipemix_recent_themes';

export default function HomeScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setDeck, setLoading, setError } = useDeckStore();
  const [theme, setTheme] = useState('');
  const [recentThemes, setRecentThemes] = useState<string[]>([]);

  useState(() => {
    AsyncStorage.getItem(RECENT_THEMES_KEY).then((data) => {
      if (data) setRecentThemes(JSON.parse(data));
    });
  });

  async function handleBuildDeck() {
    if (!theme.trim() || !accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await submitTheme(accessToken, theme.trim());
      setDeck(theme.trim(), response.playlistName, response.tracks);

      const updated = [theme.trim(), ...recentThemes.filter((t) => t !== theme.trim())].slice(0, 10);
      setRecentThemes(updated);
      await AsyncStorage.setItem(RECENT_THEMES_KEY, JSON.stringify(updated));

      router.push('/swipe');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRecentTap(themeText: string) {
    setTheme(themeText);
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Music size={48} color={colors.accent.primary} />
          <Text style={styles.title}>SwipeMix</Text>
          <Text style={styles.subtitle}>Build Spotify playlists with a swipe</Text>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Login with Spotify</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>SwipeMix</Text>
      </View>

      <View style={styles.centerContent}>
        <Text style={styles.prompt}>What's the vibe?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. rainy day coding, 90s road trip..."
          placeholderTextColor={colors.text.muted}
          value={theme}
          onChangeText={setTheme}
          maxLength={200}
          returnKeyType="send"
          onSubmitEditing={handleBuildDeck}
        />

        <TouchableOpacity
          style={[styles.buildButton, !theme.trim() && styles.buildButtonDisabled]}
          onPress={handleBuildDeck}
          disabled={!theme.trim()}
        >
          <Text style={styles.buildButtonText}>Build my deck</Text>
        </TouchableOpacity>
      </View>

      {recentThemes.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <History size={16} color={colors.text.secondary} />
            <Text style={styles.recentLabel}>Recent</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {recentThemes.map((t) => (
              <TouchableOpacity key={t} style={styles.chip} onPress={() => handleRecentTap(t)}>
                <Text style={styles.chipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logo: {
    ...typography.display,
    color: colors.accent.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  prompt: {
    ...typography.display,
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  input: {
    ...typography.input,
    backgroundColor: colors.bg.surface,
    color: colors.text.primary,
    borderRadius: radii.md,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buildButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  buildButtonDisabled: {
    opacity: 0.5,
  },
  buildButtonText: {
    ...typography.button,
    color: '#000',
  },
  loginButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  loginButtonText: {
    ...typography.button,
    color: '#000',
  },
  recentSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  recentLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
