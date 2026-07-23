import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
import { radii } from '../theme/spacing';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const fraction = total > 0 ? current / total : 0;
  const pct = Math.min(fraction, 1);

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: colors.bg.cardHighlight,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: radii.sm,
  },
});
