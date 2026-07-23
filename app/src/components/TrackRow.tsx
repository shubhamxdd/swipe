import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GripVertical, X, Play, Pause } from 'lucide-react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
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
  const hasPreview = !!track.previewUrl;

  return (
    <View style={styles.row} accessibilityLabel={`${track.name} by ${track.artists?.map((a) => a.name).join(', ')}`}>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton} accessibilityRole="button" accessibilityLabel={`Remove ${track.name}`}>
        <X size={18} color={colors.state.skip} />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{track.name}</Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artists?.map((a) => a.name).join(', ')}
        </Text>
      </View>

      {hasPreview && <PreviewButton source={track.previewUrl!} />}

      <GripVertical size={18} color={colors.text.muted} />
    </View>
  );
}

function PreviewButton({ source }: { source: string }) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status.playing;

  function toggle() {
    if (isPlaying) player.pause();
    else player.play();
  }

  return (
    <Pressable
      style={styles.previewButton}
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause preview' : 'Play preview'}
    >
      {isPlaying ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
    </Pressable>
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
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
