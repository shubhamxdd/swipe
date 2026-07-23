import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Music, LogIn, Send } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useDeckStore } from '../store/deckStore';
import { getAuthUrl, submitTheme } from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

const MOBILE_REDIRECT_URI = 'swipemix://auth/callback';

export default function HomeScreen() {
  const router = useRouter();
  const [themeInput, setThemeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isAuthenticated,
    isLoading: authLoading,
    setTokens,
    accessToken,
  } = useAuthStore();
  const { setDeck, setError, recentThemes } = useDeckStore();

  async function handleLogin() {
    try {
      const { url } = await getAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(url, MOBILE_REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        const resultUrl = new URL(result.url);
        const accessToken = resultUrl.searchParams.get('access_token');
        const refreshToken = resultUrl.searchParams.get('refresh_token');
        if (accessToken && refreshToken) {
          await setTokens(accessToken, refreshToken);
        } else {
          setError('Failed to retrieve tokens from redirect');
        }
      }
    } catch (err) {
      setError('Failed to connect to Spotify');
    }
  }

  async function handleSubmit() {
    const trimmed = themeInput.trim();
    if (!trimmed || !accessToken) return;
    setIsSubmitting(true);
    try {
      const data = await submitTheme(accessToken, trimmed);
      setDeck(data.theme, data.playlistName, data.tracks);
      router.push('/swipe');
    } catch {
      setError('Failed to generate playlist');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Music size={36} color={colors.accent.primary} />
        <Text style={styles.title}>SwipeMix</Text>
        <Text style={styles.subtitle}>Swipe through tracks. Build a playlist.</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Describe a vibe, mood, or theme..."
          placeholderTextColor={colors.text.muted}
          value={themeInput}
          onChangeText={setThemeInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.submitButton, !accessToken && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!accessToken || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {!isAuthenticated && (
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <LogIn size={20} color="#fff" />
          <Text style={styles.loginText}>Connect Spotify</Text>
        </TouchableOpacity>
      )}

      {recentThemes && recentThemes.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentLabel}>Recent</Text>
          <View style={styles.chipRow}>
            {recentThemes.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={styles.chip}
                onPress={() => setThemeInput(t)}
              >
                <Text style={styles.chipText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.base,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl * 1.5,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  inputSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    color: colors.text.primary,
    ...typography.input,
  },
  submitButton: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  loginText: {
    ...typography.button,
    color: '#fff',
  },
  recentSection: {
    marginTop: spacing.xl,
  },
  recentLabel: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.bg.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
