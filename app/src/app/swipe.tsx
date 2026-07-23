import { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Undo2, CheckCircle, X, Loader } from 'lucide-react-native';
import { useDeckStore } from '../store/deckStore';
import { useAuthStore } from '../store/authStore';
import { SwipeCard } from '../components/SwipeCard';
import { ProgressBar } from '../components/ProgressBar';
import { EmptyDeckMessage } from '../components/EmptyDeckMessage';
import { fetchNextBatch } from '../services/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

const FETCH_THRESHOLD = 5;

export default function SwipeScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const fetchingRef = useRef(false);

  const {
    sessionId,
    tracks,
    currentIndex,
    keepPile,
    isLoadingMore,
    exhausted,
    swipeLeft,
    swipeRight,
    undo,
    appendTracks,
    setLoadingMore,
    getKeptTracks,
  } = useDeckStore();

  const isDone = currentIndex >= tracks.length && !isLoadingMore;
  const totalKept = keepPile.length;
  const remaining = tracks.length - currentIndex;

  const handleSwipeRight = useCallback(() => {
    swipeRight();
  }, []);

  const handleSwipeLeft = useCallback(() => {
    swipeLeft();
  }, []);

  const handleFinishEarly = useCallback(() => {
    router.push('/review');
  }, []);

  useEffect(() => {
    if (fetchingRef.current) return;
    if (exhausted || !sessionId || !accessToken) return;
    if (remaining > FETCH_THRESHOLD) return;

    fetchingRef.current = true;
    setLoadingMore(true);

    const kept = getKeptTracks().map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artists.map((a) => a.name).join(', '),
    }));

    const trackIds = tracks.map((t) => t.id);
    const keepPileSet = new Set(keepPile);
    const skippedIds = trackIds.filter((id) => !keepPileSet.has(id));

    fetchNextBatch(accessToken, sessionId, kept, skippedIds, trackIds)
      .then((data) => {
        appendTracks(data.tracks, data.exhausted);
      })
      .catch(() => {
        setLoadingMore(false);
      })
      .finally(() => {
        fetchingRef.current = false;
      });
  }, [remaining, sessionId, accessToken, exhausted]);

  if (tracks.length === 0 && !isLoadingMore) {
    return <EmptyDeckMessage />;
  }

  if (isDone) {
    return (
      <SafeAreaView style={styles.centered} accessibilityLabel="All tracks reviewed">
        <CheckCircle size={48} color={colors.accent.primary} />
        <Text style={styles.doneTitle}>All done!</Text>
        <Text style={styles.doneSub}>
          {totalKept} track{totalKept !== 1 ? 's' : ''} saved
        </Text>
        <Text style={styles.doneSub}>Review and reorder before saving.</Text>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => router.push('/review')}
          accessibilityRole="button"
          accessibilityLabel="Review playlist"
        >
          <Text style={styles.reviewText}>Review Playlist</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const currentTrack = tracks[currentIndex];

  return (
    <SafeAreaView style={styles.container} accessibilityLabel="Swipe screen">
      <View style={styles.topBar}>
        <Text style={styles.counter}>
          {remaining} of {tracks.length}
          {isLoadingMore && ' +'}
        </Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.finishEarlyButton}
            onPress={handleFinishEarly}
            accessibilityRole="button"
            accessibilityLabel="Finish swiping early and review your playlist"
          >
            <X size={16} color={colors.text.secondary} />
            <Text style={styles.finishEarlyText}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={currentIndex === 0}
            onPress={undo}
            accessibilityRole="button"
            accessibilityLabel={currentIndex === 0 ? 'Nothing to undo' : 'Undo last swipe'}
          >
            <Undo2 size={22} color={currentIndex === 0 ? colors.text.muted : colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ProgressBar current={currentIndex} total={tracks.length} />

      <View style={styles.cardContainer}>
        {currentTrack && (
          <SwipeCard
            key={currentTrack.id}
            track={currentTrack}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}
        {isLoadingMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.accent.primary} />
            <Text style={styles.loadingMoreText}>Finding more tracks...</Text>
          </View>
        )}
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={swipeLeft}
          accessibilityRole="button"
          accessibilityLabel="Skip this track"
        >
          <Text style={styles.actionLabel}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keepButton}
          onPress={swipeRight}
          accessibilityRole="button"
          accessibilityLabel="Keep this track"
        >
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
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  finishEarlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finishEarlyText: {
    ...typography.caption,
    color: colors.text.secondary,
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
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  loadingMoreText: {
    ...typography.caption,
    color: colors.text.muted,
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
