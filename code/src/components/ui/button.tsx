import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { VariantRgb, type ColorScheme } from '@/constants/theme';
import { useColorSchemeName } from '@/hooks/use-theme';

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'error'
  | 'warning'
  | 'info';
/** Same as nexus-web, plus `solid` (full-strength fill, white text) for call-to-action buttons. */
export type ButtonAppearance = 'default' | 'link' | 'outline' | 'solid';
export type ButtonSize = 'sm' | 'md' | 'lg';
/** Font Awesome 6 Free icon name (solid style, falling back to regular/brands when that is where the glyph lives). */
export type IconName = string;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children?: ReactNode;
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  size?: ButtonSize;
  /** Font Awesome 6 (solid) icon names, e.g. "right-to-bracket". */
  iconLeft?: IconName;
  iconRight?: IconName;
  iconOnly?: IconName;
  working?: boolean;
  noShadow?: boolean;
  active?: boolean;
  disabled?: boolean;
  /** Force light/dark styling (e.g. on a fixed navy background) instead of following the OS. */
  scheme?: ColorScheme;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

type Rgb = readonly [number, number, number];
type Look = { background: string; pressed: string; text: string; border?: string };

const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r},${g},${b},${a})`;
/** Sass color.mix(black, color, pct) */
const darken = ([r, g, b]: Rgb, pct: number): Rgb => [
  Math.round(r * (1 - pct)),
  Math.round(g * (1 - pct)),
  Math.round(b * (1 - pct)),
];

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];

/** Port of the button-style() mixin in nexus-web's Button.scss. */
function colorLook(rgb: Rgb, appearance: ButtonAppearance, scheme: ColorScheme): Look {
  const text = rgba(scheme === 'light' ? darken(rgb, 0.4) : rgb, 1);
  switch (appearance) {
    case 'solid':
      return { background: rgba(rgb, 1), pressed: rgba(darken(rgb, 0.15), 1), text: '#FFFFFF' };
    case 'link':
      return { background: 'transparent', pressed: rgba(rgb, 0.08), text };
    case 'outline':
      return { background: 'transparent', pressed: rgba(rgb, 0.08), text, border: rgba(rgb, 0.6) };
    default:
      return {
        background: rgba(rgb, scheme === 'light' ? 0.15 : 0.25),
        pressed: rgba(rgb, 0.35),
        text,
      };
  }
}

/** The neutral `default` variant, which nexus-web styles separately from the color variants. */
function neutralLook(appearance: ButtonAppearance, scheme: ColorScheme): Look {
  const light = scheme === 'light';
  const base = light ? BLACK : WHITE;
  const text = light ? '#333333' : '#AAAAAA';
  switch (appearance) {
    case 'solid':
      return light
        ? { background: '#58595B', pressed: '#3F4042', text: '#FFFFFF' }
        : { background: '#DFE5F0', pressed: '#B9C0CC', text: '#1E2126' };
    case 'link':
      return { background: 'transparent', pressed: rgba(base, light ? 0.15 : 0.35), text };
    case 'outline':
      return { background: 'transparent', pressed: rgba(base, 0.35), text, border: rgba(base, 0.6) };
    default:
      return {
        background: rgba(base, light ? 0.15 : 0.25),
        pressed: rgba(base, light ? 0.3 : 0.35),
        text,
      };
  }
}

/** btn--working: greyed out regardless of variant. */
function workingLook(appearance: ButtonAppearance, scheme: ColorScheme): Look {
  const light = scheme === 'light';
  const base = light ? BLACK : WHITE;
  const background = appearance === 'link' || appearance === 'outline' ? 'transparent' : rgba(base, light ? 0.15 : 0.25);
  return {
    background,
    pressed: background,
    text: light ? '#666666' : '#888888',
    border: appearance === 'outline' ? rgba(base, 0.6) : undefined,
  };
}

const sizes = {
  sm: { height: 28, paddingHorizontal: 12, borderRadius: 3, fontSize: 12, icon: 11 },
  md: { height: 36, paddingHorizontal: 16, borderRadius: 4, fontSize: 14, icon: 13 },
  lg: { height: 44, paddingHorizontal: 24, borderRadius: 4, fontSize: 16, icon: 15 },
} as const;

export function Button({
  children,
  variant = 'primary',
  appearance = 'default',
  size = 'md',
  iconLeft,
  iconRight,
  iconOnly,
  working = false,
  noShadow = false,
  active = false,
  disabled = false,
  scheme,
  style,
  textStyle,
  onPress,
  ...props
}: ButtonProps) {
  const osScheme = useColorSchemeName();
  const resolvedScheme = scheme ?? osScheme;

  const look = working
    ? workingLook(appearance, resolvedScheme)
    : variant === 'default'
      ? neutralLook(appearance, resolvedScheme)
      : colorLook(VariantRgb[variant], appearance, resolvedScheme);

  const dims = sizes[size];
  const iconProps = { size: dims.icon, color: look.text } as const;
  const spinner = <ActivityIndicator size="small" color={look.text} />;
  const label =
    typeof children === 'string' || typeof children === 'number' ? (
      <Text style={[styles.label, { fontSize: dims.fontSize, color: look.text }, textStyle]}>{children}</Text>
    ) : (
      children
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: working, selected: active }}
      disabled={disabled}
      onPress={working ? undefined : onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.base,
        {
          height: dims.height,
          borderRadius: dims.borderRadius,
          paddingHorizontal: iconOnly ? 0 : dims.paddingHorizontal,
          width: iconOnly ? dims.height : undefined,
          backgroundColor: (pressed || hovered || active) && !disabled ? look.pressed : look.background,
        },
        look.border && { borderWidth: 1, borderColor: look.border },
        appearance === 'solid' && !noShadow && !disabled && styles.shadow,
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      {iconOnly ? (
        working ? (
          spinner
        ) : (
          <FontAwesome6 name={iconOnly} solid {...iconProps} />
        )
      ) : (
        <View style={styles.content}>
          {iconLeft && <FontAwesome6 name={iconLeft} solid style={styles.iconLeft} {...iconProps} />}
          {label}
          {working ? (
            <View style={styles.iconRight}>{spinner}</View>
          ) : (
            iconRight && <FontAwesome6 name={iconRight} solid style={styles.iconRight} {...iconProps} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  shadow: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  },
  disabled: {
    opacity: 0.75,
  },
});
