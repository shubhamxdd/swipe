import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Trash2, LogOut, Info } from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { useDeckStore } from '../store/deckStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

export default function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const reset = useDeckStore((s) => s.reset);

  async function handleClearCache() {
    Alert.alert(
      'Clear Cache',
      'This will remove saved sessions, recent themes, and playlist history. You will stay logged in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'swipemix_active_session',
              'swipemix_playlist_history',
            ]);
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ],
    );
  }

  async function handleLogout() {
    Alert.alert(
      'Log Out',
      'Are you sure you want to disconnect from Spotify?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            reset();
            await logout();
            router.replace('/');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.row}>
            <Info size={20} color={colors.text.muted} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>SwipeMix</Text>
              <Text style={styles.rowSub}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <TouchableOpacity style={styles.row} onPress={handleClearCache} accessibilityRole="button" accessibilityLabel="Clear local cache">
            <Trash2 size={20} color={colors.text.muted} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Clear Cache</Text>
              <Text style={styles.rowSub}>Remove saved sessions and history</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <TouchableOpacity style={styles.row} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out of Spotify">
            <LogOut size={20} color="#ef4444" />
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: '#ef4444' }]}>Log Out</Text>
              <Text style={styles.rowSub}>Disconnect from Spotify</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  title: { ...typography.trackTitle, color: colors.text.primary },
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionLabel: {
    ...typography.caption, color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radii.md,
    padding: spacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { ...typography.body, color: colors.text.primary },
  rowSub: { ...typography.caption, color: colors.text.muted, marginTop: 2 },
});
