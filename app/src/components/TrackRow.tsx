import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GripVertical, X } from 'lucide-react-native';
import type { SpotifyTrack } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

interface TrackRowProps {
  track: SpotifyTrack;
  onRemove: () => void;
  onDrag?: () => void;
}

export function TrackRow({ track, onRemove }: TrackRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton} accessibilityRole="button" accessibilityLabel={`Remove ${track.name}`}>
        <X size={18} color={colors.state.skip} />
      </TouchableOpacity>

      <View style={styles.info} accessibilityLabel={`${track.name} by ${track.artists?.map((a) => a.name).join(', ')}`}>
        <Text style={styles.title} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artists?.map((a) => a.name).join(', ')}
        </Text>
      </View>

      <GripVertical size={18} color={colors.text.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  removeButton: {
    padding: spacing.xs,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.trackTitle,
    fontSize: 15,
    color: colors.text.primary,
  },
  artist: {
    ...typography.artistName,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
