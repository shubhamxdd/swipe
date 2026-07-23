import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { X, GripVertical } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';
import type { SpotifyTrack } from '../types';

interface TrackRowProps {
  track: SpotifyTrack;
  onRemove: () => void;
  index: number;
}

export default function TrackRow({ track, onRemove, index }: TrackRowProps) {
  const imageUrl = track.album.images[2]?.url || track.album.images[0]?.url;

  return (
    <View style={styles.row}>
      <Text style={styles.index}>{index + 1}</Text>

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailFallback]} />
      )}

      <View style={styles.info}>
        <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {track.artists.map((a) => a.name).join(', ')}
        </Text>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <X size={16} color={colors.text.muted} />
      </TouchableOpacity>

      <GripVertical size={16} color={colors.text.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  index: {
    ...typography.caption,
    color: colors.text.muted,
    width: 24,
    textAlign: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radii.albumArt,
  },
  thumbnailFallback: {
    backgroundColor: colors.bg.surface,
  },
  info: {
    flex: 1,
  },
  trackName: {
    ...typography.body,
    color: colors.text.primary,
  },
  artistName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  removeButton: {
    padding: spacing.xs,
  },
});
