import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Play, Pause } from 'lucide-react-native';
import type { SpotifyTrack } from '../types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  track: SpotifyTrack;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeCard({ track, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const rotate = useSharedValue('0deg');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: rotate.value },
    ],
  }));

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = `${(event.translationX / SCREEN_WIDTH) * 25}deg`;
    })
    .onEnd((event) => {
      const willSwipeRight =
        translateX.value > SWIPE_THRESHOLD ||
        (event.velocityX > 500 && translateX.value > 0);
      const willSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD ||
        (event.velocityX < -500 && translateX.value < 0);

      if (willSwipeRight) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 15 });
        onSwipeRight();
      } else if (willSwipeLeft) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 15 });
        onSwipeLeft();
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        rotate.value = withSpring('0deg', { damping: 20 });
      }
    });

  const imageUrl = track.album?.images?.[0]?.url;
  const hasPreview = !!track.previewUrl;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {imageUrl && (
          <View>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            {hasPreview && <PreviewButton source={track.previewUrl!} />}
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artists?.map((a) => a.name).join(', ')}
          </Text>
        </View>

        <View style={styles.swipeHintContainer}>
          <View style={styles.swipeHintLeft}>
            <Text style={styles.swipeHintLabel}>SKIP</Text>
          </View>
          <View style={styles.swipeHintRight}>
            <Text style={styles.swipeHintLabelKeep}>KEEP</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function PreviewButton({ source }: { source: string }) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const icon = isPlaying ? Pause : Play;

  function toggle() {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }

  return (
    <Pressable style={styles.previewButton} onPress={toggle}>
      {icon({ size: 28, color: '#fff' })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.bg.elevated,
    borderRadius: radii.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
  },
  previewButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  info: {
    padding: spacing.lg,
  },
  title: {
    ...typography.trackTitle,
    color: colors.text.primary,
  },
  artist: {
    ...typography.artistName,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  swipeHintContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swipeHintLeft: {
    borderWidth: 3,
    borderColor: colors.state.skip,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    opacity: 0.8,
  },
  swipeHintRight: {
    borderWidth: 3,
    borderColor: colors.state.like,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    opacity: 0.8,
  },
  swipeHintLabel: {
    color: colors.state.skip,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 2,
  },
  swipeHintLabelKeep: {
    color: colors.state.like,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: 2,
  },
});
