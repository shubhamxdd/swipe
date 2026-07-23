import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Music, LogIn, LogOut, Send, Sparkles, Clock, RotateCcw, Settings } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useDeckStore } from '../store/deckStore';
import { useHistoryStore } from '../store/historyStore';
import { getAuthUrl, getTokens, submitTheme, checkHealth, suggestTheme } from '../services/api';
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
  const [healthOk, setHealthOk] = useState(true);

  useEffect(() => {
    async function poll() {
      try {
        const res = await checkHealth();
        setHealthOk(res.status === 'ok');
      } catch {
        setHealthOk(false);
      }
    }
    poll();
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
  }, []);

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
  const { setDeck, setDeckBatch, setError, recentThemes, reset, loadSession, savedSession, restoreSession } = useDeckStore();
  const { history, loadHistory } = useHistoryStore();

  useEffect(() => {
    loadSession();
    loadHistory();
  }, []);

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

  async function handleQuickMix() {
    const trimmed = themeInput.trim();
    if (!trimmed || !accessToken) return;
    submitThemeRef.current = trimmed;
    setIsSubmitting(true);
    try {
      const data = await submitTheme(accessToken, trimmed);
      setDeckBatch(data.sessionId, data.theme, data.playlistName, data.tracks);
      router.push('/review');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to generate playlist');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAISuggest() {
    if (!accessToken) return;
    try {
      const { suggestion } = await suggestTheme(accessToken);
      setThemeInput(suggestion);
    } catch {
      setError('Failed to get suggestion');
    }
  }

  async function handleResume() {
    if (!savedSession) return;
    restoreSession(savedSession);
    router.push('/swipe');
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Music size={36} color={colors.accent.primary} />
            <Text style={styles.title}>SwipeMix</Text>
            <View style={[styles.healthDot, { backgroundColor: healthOk ? '#22c55e' : '#ef4444' }]} />
          </View>
          {isAuthenticated && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Settings size={18} color={colors.text.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                accessibilityRole="button"
                accessibilityLabel="Log out of Spotify"
              >
                <LogOut size={18} color={colors.text.muted} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Swipe through tracks. Build a playlist.</Text>

        {savedSession && (
          <TouchableOpacity style={styles.resumeBanner} onPress={handleResume} accessibilityRole="button" accessibilityLabel="Resume your last session">
            <RotateCcw size={18} color={colors.accent.primary} />
            <View style={styles.resumeTextCol}>
              <Text style={styles.resumeTitle}>Resume "{savedSession.theme}"</Text>
              <Text style={styles.resumeSub}>{savedSession.tracks.length} tracks · {savedSession.keepPile.length} kept</Text>
            </View>
          </TouchableOpacity>
        )}

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
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleAISuggest}
            accessibilityRole="button"
            accessibilityLabel="Suggest a random theme"
          >
            <Sparkles size={20} color={colors.accent.primary} />
          </TouchableOpacity>
        </View>

        {isAuthenticated && themeInput.trim().length >= 2 && (
          <TouchableOpacity
            style={styles.quickMixButton}
            onPress={handleQuickMix}
            accessibilityRole="button"
            accessibilityLabel="Quick mix — skip swiping and keep all tracks"
          >
            <Text style={styles.quickMixText}>Quick Mix — Keep All</Text>
          </TouchableOpacity>
        )}

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
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recent Themes</Text>
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

        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Past Playlists</Text>
            {history.map((entry) => (
              <TouchableOpacity
                key={entry.id + entry.createdAt}
                style={styles.historyItem}
                onPress={() => setThemeInput(entry.theme)}
                accessibilityRole="button"
                accessibilityLabel={`${entry.name} — ${entry.trackCount} tracks`}
              >
                <Clock size={16} color={colors.text.muted} />
                <View style={styles.historyItemCol}>
                  <Text style={styles.historyItemName} numberOfLines={1}>{entry.name}</Text>
                  <Text style={styles.historyItemMeta}>
                    {entry.trackCount} tracks · {new Date(entry.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, backgroundColor: colors.bg.base },
  scrollContent: { paddingBottom: spacing.xxl * 2 },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.bg.base, paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.xxl * 1.5, marginBottom: spacing.sm,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  subtitle: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.xxl },
  title: { ...typography.display, color: colors.text.primary },
  healthDot: { width: 8, height: 8, borderRadius: 4, marginLeft: spacing.xs },
  loadingTextContainer: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.lg, paddingHorizontal: spacing.xl,
  },
  loadingText: { ...typography.body, color: colors.text.secondary, textAlign: 'center', flexShrink: 1 },
  inputSection: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  input: {
    flex: 1, height: 50, backgroundColor: colors.bg.surface, borderRadius: radii.md,
    paddingHorizontal: spacing.lg, color: colors.text.primary, ...typography.input,
  },
  submitButton: {
    width: 50, height: 50, borderRadius: radii.md, backgroundColor: colors.accent.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  aiButton: {
    width: 50, height: 50, borderRadius: radii.md, backgroundColor: colors.bg.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  quickMixButton: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg.surface, borderRadius: radii.md,
    paddingVertical: spacing.md, marginBottom: spacing.lg,
  },
  quickMixText: { ...typography.button, color: colors.accent.primary },
  loginButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent.primary, borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  loginText: { ...typography.button, color: '#fff' },
  resumeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radii.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  resumeTextCol: { flex: 1 },
  resumeTitle: { ...typography.body, color: colors.accent.primary, fontWeight: '600' },
  resumeSub: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
  section: { marginTop: spacing.xl },
  sectionLabel: {
    ...typography.caption, color: colors.text.muted, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.bg.surface, borderRadius: radii.xl,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  chipText: { ...typography.caption, color: colors.text.secondary },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  historyItemCol: { flex: 1 },
  historyItemName: { ...typography.body, color: colors.text.primary },
  historyItemMeta: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
});
