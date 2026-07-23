import { Image, Linking, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { X, ExternalLink, Disc, Calendar, Clock, User } from 'lucide-react-native';
import type { SpotifyTrack } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

interface TrackDetailModalProps {
  track: SpotifyTrack | null;
  visible: boolean;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function extractYear(dateStr?: string): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 4);
}

export function TrackDetailModal({ track, visible, onClose }: TrackDetailModalProps) {
  if (!track) return null;

  const imageUrl = track.album?.images?.[0]?.url;
  const spotifyUri = track.uri;
  const albumName = track.album?.name;
  const releaseYear = extractYear(track.album?.release_date);
  const artistNames = track.artists.map((a) => a.name).join(', ');
  const duration = formatDuration(track.duration_ms);

  function handleOpen() {
    Linking.openURL(spotifyUri);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => {}}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <X size={20} color={colors.text.primary} />
          </TouchableOpacity>

          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.art} resizeMode="cover" />
          )}

          <Text style={styles.title} numberOfLines={2}>{track.name}</Text>
          <Text style={styles.artist} numberOfLines={1}>{artistNames}</Text>

          <View style={styles.infoGrid}>
            {albumName && (
              <View style={styles.infoRow}>
                <Disc size={14} color={colors.text.muted} />
                <Text style={styles.infoText} numberOfLines={1}>{albumName}</Text>
              </View>
            )}
            {releaseYear && (
              <View style={styles.infoRow}>
                <Calendar size={14} color={colors.text.muted} />
                <Text style={styles.infoText}>{releaseYear}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Clock size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>{duration}</Text>
            </View>
            <View style={styles.infoRow}>
              <User size={14} color={colors.text.muted} />
              <Text style={styles.infoText} numberOfLines={1}>{track.artists.map((a) => a.name).join(', ')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.openButton} onPress={handleOpen} accessibilityRole="button" accessibilityLabel="Open in Spotify">
            <ExternalLink size={18} color="#fff" />
            <Text style={styles.openText}>Open in Spotify</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  art: {
    width: 200,
    height: 200,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.trackTitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  artist: {
    ...typography.artistName,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  infoGrid: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  openText: {
    ...typography.button,
    color: '#fff',
  },
});
