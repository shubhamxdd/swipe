import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

export function EmptyDeckMessage() {
  const router = useRouter();

  return (
    <View style={styles.container} accessibilityLabel="No tracks found">
      <Search size={40} color={colors.text.muted} />
      <Text style={styles.title}>No tracks found</Text>
      <Text style={styles.subtitle}>
        Try a different theme or be more specific about the vibe you're looking for.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back and try a new theme"
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
    fontSize: 22,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonText: {
    ...typography.button,
    color: '#fff',
  },
});
