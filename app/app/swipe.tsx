import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Undo2, X, Check } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useDeckStore } from '../src/store/deckStore';
import SwipeCard from '../src/components/SwipeCard';
import ProgressBar from '../src/components/ProgressBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function SwipeScreen() {
  const router = useRouter();
  const { tracks, currentIndex, isLoading, swipeRight, swipeLeft, undo } = useDeckStore();
  const [factExpanded, setFactExpanded] = useState(false);
  const [currentFact, setCurrentFact] = useState<string | undefined>();

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const currentTrack = tracks[currentIndex];
  const remaining = tracks.length - currentIndex;

  const player = useAudioPlayer(currentTrack?.previewUrl ?? null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (player.playing) {
      player.pause();
      player.seekTo(0);
    }
    if (currentTrack?.previewUrl) {
      player.play();
    }
  }, [currentIndex]);

  const handleSwipeRight = useCallback(() => {
    swipeRight();
  }, [swipeRight]);

  const handleSwipeLeft = useCallback(() => {
    swipeLeft();
  }, [swipeLeft]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = event.translationX / 20;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(handleSwipeRight)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleSwipeLeft)();
      }
      translateX.value = withSpring(0);
      rotate.value = withSpring(0);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  function handlePlayToggle() {
    if (!currentTrack?.previewUrl) return;
    if (status.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  }

  function handleFactToggle() {
    if (factExpanded) {
      setFactExpanded(false);
    } else {
      setCurrentFact(`${currentTrack?.name} is a great track for this mood!`);
      setFactExpanded(true);
    }
  }

  function handleFinishEarly() {
    player.pause();
    router.push('/review');
  }

  function handleUndo() {
    undo();
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Building your deck...</Text>
      </View>
    );
  }

  if (remaining <= 0) {
    router.replace('/review');
    return null;
  }

  if (!currentTrack) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ProgressBar current={currentIndex + 1} total={tracks.length} />
        <TouchableOpacity onPress={handleFinishEarly}>
          <Text style={styles.finishEarly}>Finish early</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={cardStyle}>
            <SwipeCard
              track={currentTrack}
              isActive={true}
              isPlaying={status.playing}
              onPlay={handlePlayToggle}
              onFactToggle={handleFactToggle}
              factExpanded={factExpanded}
              funFact={currentFact}
            />
          </Animated.View>
        </GestureDetector>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.undoButton} onPress={handleUndo}>
          <Undo2 size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.swipeActions}>
          <TouchableOpacity
            style={[styles.swipeButton, styles.skipButton]}
            onPress={handleSwipeLeft}
          >
            <X size={24} color={colors.state.skip} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.swipeButton, styles.likeButton]}
            onPress={handleSwipeRight}
          >
            <Check size={24} color={colors.state.like} />
          </TouchableOpacity>
        </View>
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
  finishEarly: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  undoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  swipeActions: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  swipeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  skipButton: {
    borderColor: colors.state.skip,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  likeButton: {
    borderColor: colors.state.like,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
