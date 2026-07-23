import { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, SaveIcon, Plus } from 'lucide-react-native';
import { useDeckStore } from '../store/deckStore';
import { useAuthStore } from '../store/authStore';
import { useHistoryStore } from '../store/historyStore';
import { savePlaylist, fetchPlaylists } from '../services/api';
import { TrackRow } from '../components/TrackRow';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';
import type { PlaylistItem } from '../types';

export default function ReviewScreen() {
  const router = useRouter();
  const { playlistName, keepPile, tracks, currentIndex, removeTrack, reorderTracks, reset, theme } = useDeckStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);
  const [saving, setSaving] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState('');

  const filteredPlaylists = useMemo(
    () => playlists.filter((p) =>
      p.name.toLowerCase().includes(playlistSearch.toLowerCase()),
    ),
    [playlists, playlistSearch],
  );

  const keptTracks = useMemo(
    () => keepPile
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is NonNullable<typeof t> => t != null),
    [keepPile, tracks],
  );

  async function handleSave(existingPlaylistId?: string) {
    if (!accessToken || keptTracks.length === 0) return;
    setSaving(true);
    try {
      const trackIds = keptTracks.map((t) => t.id);
      const result = await savePlaylist(
        accessToken,
        playlistName || 'SwipeMix Playlist',
        trackIds,
        existingPlaylistId,
      );

      await addHistoryEntry({
        id: result.id,
        name: result.name,
        theme: theme || '',
        trackCount: trackIds.length - (result.skippedDuplicates || 0),
        url: result.url,
        createdAt: new Date().toISOString(),
      });

      let message = '';
      if (result.skippedDuplicates && result.skippedDuplicates > 0) {
        message = `${result.skippedDuplicates} duplicate${result.skippedDuplicates > 1 ? 's' : ''} skipped. `;
      }
      message += `${trackIds.length - (result.skippedDuplicates || 0)} track${trackIds.length - (result.skippedDuplicates || 0) !== 1 ? 's' : ''} added.`;

      setPickerVisible(false);
      router.replace(`/confirmation?url=${encodeURIComponent(result.url)}&name=${encodeURIComponent(result.name)}&message=${encodeURIComponent(message)}`);
    } catch {
      Alert.alert('Error', 'Failed to save playlist');
    } finally {
      setSaving(false);
    }
  }

  async function openPlaylistPicker() {
    setPlaylistSearch('');
    setLoadingPlaylists(true);
    setPickerVisible(true);
    try {
      const data = await fetchPlaylists(accessToken!);
      setPlaylists(data.playlists);
    } catch {
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }

  async function handleReplay() {
    reset();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back to swiping">
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Review</Text>
          <Text style={styles.subtitle}>{keptTracks.length} tracks</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statItem}>{currentIndex} swiped</Text>
          <Text style={styles.statItem}>{keepPile.length} kept</Text>
          <Text style={styles.statItem}>{currentIndex - keepPile.length} skipped</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={keptTracks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TrackRow track={item} onRemove={() => removeTrack(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tracks kept yet.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.replayButton} onPress={handleReplay} accessibilityRole="button" accessibilityLabel="Start over with a new theme">
          <Text style={styles.replayText}>Start Over</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, (saving || keptTracks.length === 0) && styles.saveDisabled]}
          disabled={saving || keptTracks.length === 0}
          onPress={() => handleSave()}
          accessibilityRole="button"
          accessibilityLabel={saving ? 'Saving playlist' : 'Save as new playlist'}
        >
          <SaveIcon size={20} color="#fff" />
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save New'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, (saving || keptTracks.length === 0) && styles.saveDisabled]}
          disabled={saving || keptTracks.length === 0}
          onPress={openPlaylistPicker}
          accessibilityRole="button"
          accessibilityLabel="Add to existing playlist"
        >
          <Plus size={20} color={colors.accent.primary} />
          <Text style={styles.addText}>Add to</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Add to Playlist</Text>
            {loadingPlaylists ? (
              <ActivityIndicator size="large" color={colors.accent.primary} style={{ margin: spacing.xl }} />
            ) : playlists.length === 0 ? (
              <Text style={styles.pickerEmpty}>No playlists found.</Text>
            ) : (
              <>
              <TextInput
                style={styles.pickerSearch}
                placeholder="Search playlists..."
                placeholderTextColor={colors.text.muted}
                value={playlistSearch}
                onChangeText={setPlaylistSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FlatList
                data={filteredPlaylists}
                keyExtractor={(item) => item.id}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => handleSave(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Add to ${item.name}`}
                  >
                    <Text style={styles.pickerItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.pickerItemCount}>{item.tracks?.total ? `${item.tracks.total} tracks` : ''}</Text>
                  </TouchableOpacity>
                )}
              />
              </>
            )}
            <TouchableOpacity style={styles.pickerCancel} onPress={() => setPickerVisible(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40 },
  headerText: { alignItems: 'center' },
  headerStats: { flexDirection: 'row', gap: spacing.md },
  statItem: { ...typography.caption, color: colors.text.secondary },
  title: { ...typography.trackTitle, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary },
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { ...typography.body, color: colors.text.muted },
  footer: {
    flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  replayButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 28, paddingVertical: spacing.md,
  },
  replayText: { ...typography.button, color: colors.text.secondary },
  saveButton: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent.primary, borderRadius: 28, paddingVertical: spacing.md,
  },
  saveDisabled: { opacity: 0.4 },
  saveText: { ...typography.button, color: '#fff' },
  addButton: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderWidth: 1, borderColor: colors.accent.primary, borderRadius: 28, paddingVertical: spacing.md,
  },
  addText: { ...typography.button, color: colors.accent.primary },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: colors.bg.elevated, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    padding: spacing.lg, maxHeight: '70%',
  },
  pickerTitle: { ...typography.trackTitle, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  pickerList: { maxHeight: 300 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pickerItemName: { ...typography.body, color: colors.text.primary, flex: 1 },
  pickerItemCount: { ...typography.caption, color: colors.text.muted },
  pickerSearch: {
    backgroundColor: colors.bg.surface, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.text.primary, marginBottom: spacing.sm,
  },
  pickerEmpty: { ...typography.body, color: colors.text.muted, textAlign: 'center', margin: spacing.xl },
  pickerCancel: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.sm },
  pickerCancelText: { ...typography.button, color: colors.text.secondary },
});
