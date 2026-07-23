import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  trackTitle: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  artistName: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400' as const,
  },
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  input: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
  },
};
