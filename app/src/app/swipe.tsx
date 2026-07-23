import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Undo2, CheckCircle } from 'lucide-react-native';
import { useDeckStore } from '../store/deckStore';
import { SwipeCard } from '../components/SwipeCard';
import { ProgressBar } from '../components/ProgressBar';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function SwipeScreen() {
  const router = useRouter();
  const {
    tracks,
    currentIndex,
    swipeLeft,
    swipeRight,
    undo,
  } = useDeckStore();

  const isDone = currentIndex >= tracks.length;
  const totalKept = tracks.length - currentIndex;

  const handleSwipeRight = useCallback(() => {
    swipeRight();
  }, []);

  const handleSwipeLeft = useCallback(() => {
    swipeLeft();
  }, []);

  if (tracks.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>No tracks loaded.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isDone) {
    return (
      <SafeAreaView style={styles.centered}>
        <CheckCircle size={48} color={colors.accent.primary} />
        <Text style={styles.doneTitle}>All done!</Text>
        <Text style={styles.doneSub}>
          {totalKept} track{totalKept !== 1 ? 's' : ''} saved
        </Text>
        <Text style={styles.doneSub}>Review and reorder before saving.</Text>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => router.push('/review')}
        >
          <Text style={styles.reviewText}>Review Playlist</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentTrack = tracks[currentIndex];
  const remaining = tracks.length - currentIndex;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.counter}>
          {remaining} of {tracks.length}
        </Text>
        <TouchableOpacity disabled={currentIndex === 0} onPress={undo}>
          <Undo2 size={22} color={currentIndex === 0 ? colors.text.muted : colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ProgressBar current={currentIndex} total={tracks.length} />

      <View style={styles.cardContainer}>
        {currentTrack && (
          <SwipeCard
            track={currentTrack}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.skipButton} onPress={swipeLeft}>
          <Text style={styles.actionLabel}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keepButton} onPress={swipeRight}>
          <Text style={styles.actionLabel}>Keep</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  counter: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  skipButton: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 32,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: 32,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    ...typography.button,
    color: '#fff',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  backButton: {
    padding: spacing.md,
  },
  backText: {
    ...typography.button,
    color: colors.accent.primary,
  },
  doneTitle: {
    ...typography.display,
    color: colors.text.primary,
  },
  doneSub: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  reviewButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent.primary,
    borderRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  reviewText: {
    ...typography.button,
    color: '#fff',
  },
});
