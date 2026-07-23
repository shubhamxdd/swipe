import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Play, Pause, Music, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';
import type { SpotifyTrack } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

interface SwipeCardProps {
  track: SpotifyTrack;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onFactToggle: () => void;
  factExpanded: boolean;
  funFact?: string;
}

export default function SwipeCard({
  track,
  isActive,
  isPlaying,
  onPlay,
  onFactToggle,
  factExpanded,
  funFact,
}: SwipeCardProps) {
  const imageUrl = track.album.images[0]?.url;

  return (
    <View style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.artwork} />
      ) : (
        <View style={[styles.artwork, styles.artworkFallback]}>
          <Music size={48} color={colors.text.muted} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.trackName} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {track.artists.map((a) => a.name).join(', ')}
        </Text>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.playButton, !track.previewUrl && styles.playButtonDisabled]}
            onPress={onPlay}
            disabled={!track.previewUrl}
          >
            {isPlaying ? (
              <Pause size={20} color="#000" />
            ) : (
              <Play size={20} color="#000" />
            )}
          </TouchableOpacity>

          {track.previewUrl ? null : (
            <Text style={styles.noPreview}>No preview available</Text>
          )}
        </View>

        {isActive && (
          <TouchableOpacity style={styles.factButton} onPress={onFactToggle}>
            <Sparkles size={14} color={colors.accent.primary} />
            <Text style={styles.factLabel}>
              {factExpanded ? 'Hide fun fact' : 'Fun fact'}
            </Text>
          </TouchableOpacity>
        )}

        {factExpanded && funFact && (
          <View style={styles.factContainer}>
            <Text style={styles.factText}>{funFact}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  artwork: {
    width: '100%',
    height: CARD_WIDTH,
  },
  artworkFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.cardHighlight,
  },
  info: {
    padding: spacing.lg,
    flex: 1,
  },
  trackName: {
    ...typography.trackTitle,
    color: colors.text.primary,
  },
  artistName: {
    ...typography.artistName,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  playButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: colors.bg.cardHighlight,
  },
  noPreview: {
    ...typography.caption,
    color: colors.text.muted,
  },
  factButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  factLabel: {
    ...typography.caption,
    color: colors.accent.primary,
  },
  factContainer: {
    backgroundColor: colors.surface.fact,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  factText: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 12,
  },
});
