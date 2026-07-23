import { StyleSheet, Text, View } from 'react-native';
import { Music } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export function NoPreviewBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="No preview available">
      <Music size={12} color={colors.text.muted} />
      <Text style={styles.label}>No Preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
    fontSize: 11,
  },
});
