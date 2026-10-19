import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

import { LogoPaths, type LogoPart } from '@/components/ui/logo-paths';
import { Brand, type ColorScheme } from '@/constants/theme';
import { useColorSchemeName } from '@/hooks/use-theme';

export type LogoColor = 'default' | 'default-white' | 'ui-color' | 'ui-white' | 'white';
export type LogoVariant = 'wordmark' | 'abbreviation' | 'icon';

export interface LogoProps extends ViewProps {
  color?: LogoColor;
  /** Rendered width in px; height follows the variant's aspect ratio. */
  width?: number;
  variant?: LogoVariant;
  /** Force light/dark colors (e.g. on a fixed-color background) instead of following the OS. */
  scheme?: ColorScheme;
  style?: StyleProp<ViewStyle>;
}

/** [primary fill (icon-bottom, wordmark, abbr), accent fill (icon-top, divider)] — mirrors Logo.scss. */
type Fills = readonly [string, string];

const palette: Record<LogoColor, Record<ColorScheme, Fills>> = {
  default: {
    light: [Brand.navy, Brand.sage],
    dark: [Brand.headerNavy, Brand.headerSage],
  },
  'default-white': {
    light: [Brand.white, Brand.sage],
    dark: [Brand.white, Brand.sage],
  },
  'ui-color': {
    light: [Brand.headerNavy, Brand.headerSage],
    dark: [Brand.white, Brand.headerSage],
  },
  'ui-white': {
    light: [Brand.white, Brand.headerSage],
    dark: [Brand.white, Brand.headerSage],
  },
  white: {
    light: [Brand.white, Brand.white],
    dark: [Brand.white, Brand.white],
  },
};

const isAccent = (part: LogoPart) => part === 'icon-top' || part === 'divider';

export function Logo({
  width = 500,
  color = 'default',
  variant = 'wordmark',
  scheme,
  style,
  ...props
}: LogoProps) {
  const osScheme = useColorSchemeName();
  const [primary, accent] = palette[color][scheme ?? osScheme];
  const art = LogoPaths[variant];
  const [vbWidth, vbHeight] = art.viewBox;
  const abbrOffsetX = 'abbrOffsetX' in art ? art.abbrOffsetX : 0;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Gateway Engineers"
      style={[{ width, height: (width * vbHeight) / vbWidth }, style]}
      {...props}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${vbWidth} ${vbHeight}`}>
        {art.paths.map(({ part, d }, i) => {
          const path = <Path key={i} d={d} fill={isAccent(part) ? accent : primary} />;
          return part === 'abbr' ? (
            <G key={i} transform={`translate(${abbrOffsetX} 0)`}>
              {path}
            </G>
          ) : (
            path
          );
        })}
      </Svg>
    </View>
  );
}
