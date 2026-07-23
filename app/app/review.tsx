import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Save } from 'lucide-react-native';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { radii, spacing } from '../src/theme/spacing';
import { useAuthStore } from '../src/store/authStore';
import { useDeckStore } from '../src/store/deckStore';
import { savePlaylist } from '../src/services/api';
import TrackRow from '../src/components/TrackRow';

export default function ReviewScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { playlistName, getKeptTracks, removeTrack, reorderTracks, keepPile, theme } = useDeckStore();
  const [name, setName] = useState(playlistName || '');
  const [saving, setSaving] = useState(false);

  const keptTracks = getKeptTracks();

  async function handleSave() {
    if (!accessToken || keptTracks.length === 0) return;

    setSaving(true);
    try {
      const result = await savePlaylist(
        accessToken,
        name || `${theme || 'Mix'} vibes`,
        keptTracks.map((t) => t.id),
      );
      router.push({ pathname: '/confirmation', params: { url: result.url, name: result.name, trackCount: result.trackCount } });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Playlist name"
        placeholderTextColor={colors.text.muted}
        maxLength={100}
      />

      <ScrollView style={styles.list}>
        {keptTracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            onRemove={() => removeTrack(track.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.trackCount}>{keptTracks.length} tracks</Text>
        <TouchableOpacity
          style={[styles.saveButton, (saving || keptTracks.length === 0) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving || keptTracks.length === 0}
        >
          <Save size={16} color="#000" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save to Spotify'}
          </Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.accent.primary,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
  },
  nameInput: {
    ...typography.input,
    backgroundColor: colors.bg.surface,
    color: colors.text.primary,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackCount: {
    ...typography.body,
    color: colors.text.secondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...typography.button,
    color: '#000',
  },
});
