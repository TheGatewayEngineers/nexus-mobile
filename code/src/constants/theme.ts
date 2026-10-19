/**
 * Theme tokens, ported from nexus-web (src/styles/_variables.scss).
 * nexus-web switches on [data-theme]; here components read the OS color scheme via useTheme().
 */

import '@/global.css';

import { Platform } from 'react-native';

// Brand colors
export const Brand = {
  navy: '#003349',
  sage: '#839B70',
  ocean: '#006074',
  hillside: '#647C3C',
  stone: '#B2AAA3',
  clay: '#EDAC8D',
  asphalt: '#58595B',
  steam: '#E6E7E8',
  rust: '#dc5a63',
  plum: '#833B61',
  graysky: '#C6CFD8',
  white: '#FFFFFF',
  black: '#000000',

  // Header colors
  headerNavy: '#003349',
  headerNavyDk: '#1F88D5',
  headerSage: '#72A14D',
  headerSageDk: '#8DC064',
} as const;

export const Colors = {
  light: {
    text: '#1E2126',
    textSecondary: '#4E586D',
    textLight: '#63748D',
    background: '#F7F7F7',
    backgroundElement: '#EBF0F6',
    backgroundSelected: '#D6DDEB',
    link: '#17669F',
    divider: 'rgba(0,0,0,0.10)',
  },
  dark: {
    text: '#DFE5F0',
    textSecondary: '#9ba4b5',
    textLight: '#748aa6',
    background: '#000000',
    backgroundElement: '#141518',
    backgroundSelected: '#2C3137',
    link: '#1F88D5',
    divider: 'rgba(255,255,255,0.10)',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** RGB channels behind each Button variant (the button-style() mixin args in nexus-web's Button.scss). */
export const VariantRgb = {
  primary: [131, 184, 91],
  success: [131, 184, 91],
  secondary: [62, 113, 194],
  info: [62, 113, 194],
  danger: [206, 67, 67],
  error: [206, 67, 67],
  warning: [255, 170, 0],
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;
