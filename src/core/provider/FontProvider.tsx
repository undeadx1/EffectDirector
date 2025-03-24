import { FontFamilyProvider } from '@react-three/uikit';
import { ReactNode } from 'react';
import { inter } from '@pmndrs/msdfonts';

/** Available font configurations for the application */
const fonts = {
  /** Default system font */
  default: inter,
  /** DNFBitBit version 2 pixel font */
  DNFBitBitv2: {
    normal: '/fonts/DNFBitBitv2.json',
  },
  /** Maplestory font with light and bold variants */
  Maple: {
    normal: '/fonts/Maplestory Light.json',
    bold: '/fonts/Maplestory Bold.json',
  },
};

/**
 * Provider component for custom font families
 * Makes fonts available throughout the application for use with StyledText
 *
 * @component
 * @example
 * ```tsx
 * <FontProvider>
 *   <App />
 * </FontProvider>
 * ```
 */
export function FontProvider({ children }: { children: ReactNode }) {
  return <FontFamilyProvider {...fonts}>{children}</FontFamilyProvider>;
}
