import { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, SaveIcon } from 'lucide-react-native';
import { useDeckStore } from '../store/deckStore';
import { useAuthStore } from '../store/authStore';
import { savePlaylist } from '../services/api';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function ReviewScreen() {
  const router = useRouter();
  const { playlistName, keepPile, tracks, removeTrack, reorderTracks, reset } = useDeckStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [saving, setSaving] = useState(false);

  const keptTracks = keepPile
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean) as typeof tracks;

  async function handleSave() {
    if (!accessToken || keptTracks.length === 0) return;
    setSaving(true);
    try {
      const trackIds = keptTracks.map((t) => t.id);
      const result = await savePlaylist(accessToken, playlistName || 'SwipeMix Playlist', trackIds);
      router.replace(`/confirmation?url=${encodeURIComponent(result.playlistUrl)}&name=${encodeURIComponent(result.name)}`);
    } catch {
      Alert.alert('Error', 'Failed to save playlist');
    } finally {
      setSaving(false);
    }
  }

  async function handleReplay() {
    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Review</Text>
          <Text style={styles.subtitle}>{keptTracks.length} tracks</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={keptTracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TrackRow
            track={item}
            onRemove={() => removeTrack(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tracks kept yet.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.replayButton} onPress={handleReplay}>
          <Text style={styles.replayText}>Start Over</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (saving || keptTracks.length === 0) && styles.saveDisabled]}
          disabled={saving || keptTracks.length === 0}
          onPress={handleSave}
        >
          <SaveIcon size={20} color="#fff" />
          <Text style={styles.saveText}>
            {saving ? 'Saving...' : 'Save to Spotify'}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
  },
  headerText: {
    alignItems: 'center',
  },
  title: {
    ...typography.trackTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  replayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: spacing.md,
  },
  replayText: {
    ...typography.button,
    color: colors.text.secondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: 28,
    paddingVertical: spacing.md,
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveText: {
    ...typography.button,
    color: '#fff',
  },
});
