import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  default: 'System',
});

export const typography = {
  display: { fontFamily, fontWeight: '700' as const, fontSize: 24 },
  trackTitle: { fontFamily, fontWeight: '700' as const, fontSize: 18 },
  artistName: { fontFamily, fontWeight: '400' as const, fontSize: 14 },
  body: { fontFamily, fontWeight: '400' as const, fontSize: 14 },
  caption: { fontFamily, fontWeight: '500' as const, fontSize: 12 },
  button: { fontFamily, fontWeight: '600' as const, fontSize: 14 },
  input: { fontFamily, fontWeight: '400' as const, fontSize: 16 },
};
