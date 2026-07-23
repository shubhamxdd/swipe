import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Music, LogIn, LogOut, Send, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useDeckStore } from '../store/deckStore';
import { getAuthUrl, getTokens, submitTheme } from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

const MAX_POLL_ATTEMPTS = 20;
const POLL_DELAY_MS = 1500;

const loadingMessages = [
  (theme: string) => `Digging through the crates for "${theme}"…`,
  (theme: string) => `Finding tracks that match the mood…`,
  (theme: string) => `Curating the perfect mix…`,
  (theme: string) => `Almost there…`,
];

export default function HomeScreen() {
  const router = useRouter();
  const [themeInput, setThemeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const abortRef = useRef(false);
  const submitThemeRef = useRef('');

  useEffect(() => {
    if (!isSubmitting) {
      setLoadingMsgIndex(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(id);
  }, [isSubmitting]);

  const {
    isAuthenticated,
    isLoading: authLoading,
    setTokens,
    accessToken,
    logout,
  } = useAuthStore();
  const { setDeck, setError, recentThemes, reset } = useDeckStore();

  async function pollTokens(state: string): Promise<boolean> {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      if (abortRef.current) return false;
      await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      try {
        const tokens = await getTokens(state);
        await setTokens(tokens.access_token, tokens.refresh_token);
        return true;
      } catch {
        // tokens not ready yet
      }
    }
    return false;
  }

  async function handleLogin() {
    try {
      const { url, state } = await getAuthUrl();
      abortRef.current = false;
      setIsLoggingIn(true);
      await WebBrowser.openBrowserAsync(url);
      const ok = await pollTokens(state);
      if (!ok && !abortRef.current) setError('Authentication timed out');
    } catch (err) {
      setError('Failed to connect to Spotify');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleSubmit() {
    const trimmed = themeInput.trim();
    if (!trimmed || !accessToken) return;
    submitThemeRef.current = trimmed;
    setIsSubmitting(true);
    try {
      const data = await submitTheme(accessToken, trimmed);
      setDeck(data.sessionId, data.theme, data.playlistName, data.tracks);
      router.push('/swipe');
    } catch {
      setError('Failed to generate playlist');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    reset();
    await logout();
  }

  if (authLoading || isLoggingIn) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        {isLoggingIn && (
          <Text style={{ color: colors.text.secondary, marginTop: spacing.md }}>
            Completing authentication...
          </Text>
        )}
      </SafeAreaView>
    );
  }

  if (isSubmitting) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <View style={styles.loadingTextContainer}>
          <Sparkles size={16} color={colors.accent.primary} />
          <Text style={styles.loadingText}>
            {loadingMessages[loadingMsgIndex](submitThemeRef.current)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Music size={36} color={colors.accent.primary} />
          <Text style={styles.title}>SwipeMix</Text>
        </View>
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out of Spotify"
          >
            <LogOut size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.subtitle}>Swipe through tracks. Build a playlist.</Text>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Describe a vibe, mood, or theme..."
          placeholderTextColor={colors.text.muted}
          value={themeInput}
          onChangeText={setThemeInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Theme input"
          accessibilityHint="Describe a vibe, mood, or theme for your playlist"
        />
        <TouchableOpacity
          style={[styles.submitButton, !accessToken && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!accessToken || isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Build my deck"
        >
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {!isAuthenticated && (
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          accessibilityRole="button"
          accessibilityLabel="Connect Spotify"
        >
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
                accessibilityRole="button"
                accessibilityLabel={`Use recent theme: ${t}`}
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
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl * 1.5,
    marginBottom: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    flexShrink: 1,
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
