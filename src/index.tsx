import React, { type ComponentProps, useMemo, useState } from 'react';

import {
  type ColorValue,
  processColor,
  StyleSheet,
  type ViewProps,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import {
  callback,
  getHostComponent,
  type HybridRef,
} from 'react-native-nitro-modules';
import NitroShimmerTextConfig from '../nitrogen/generated/shared/json/NitroShimmerTextConfig.json';
import type {
  FontWeight,
  NitroShimmerTextMethods,
  NitroShimmerTextProps,
} from './specs/nitro-shimmer-text.nitro';

export type { FontWeight } from './specs/nitro-shimmer-text.nitro';

const NitroShimmerTextNative = getHostComponent<
  NitroShimmerTextProps,
  NitroShimmerTextMethods
>('NitroShimmerText', () => NitroShimmerTextConfig);

export type NitroShimmerTextRef = HybridRef<
  NitroShimmerTextProps,
  NitroShimmerTextMethods
>;

export interface ShimmerTextProps extends Omit<ViewProps, 'children'> {
  /** The text to display. */
  text: string;
  /**
   * Base text color. Accepts color strings, numbers and `DynamicColorIOS`.
   * `PlatformColor` is not supported and falls back to the default. Defaults to "#808080".
   */
  shimmerBaseColor?: ColorValue;
  /**
   * Shimmer highlight color. Accepts color strings, numbers and `DynamicColorIOS`.
   * `PlatformColor` is not supported and falls back to the default. Defaults to "#FFFFFF".
   */
  shimmerHighlightColor?: ColorValue;
  /** Shimmer sweep duration in milliseconds. Defaults to 1500. */
  shimmerDuration?: number;
  /** Font size in points (iOS) / sp (Android). Defaults to 16. */
  fontSize?: number;
  /** Font family name (e.g. "Georgia"). Falls back to the system font if not found. */
  fontFamily?: string;
  /** Font weight. Defaults to "normal". */
  fontWeight?: FontWeight;
  /** Whether the font scales with the system text size setting. Defaults to true. */
  allowFontScaling?: boolean;
  /**
   * Receives the underlying hybrid view. Must be wrapped in `callback(...)`
   * from `react-native-nitro-modules`.
   */
  hybridRef?: ComponentProps<typeof NitroShimmerTextNative>['hybridRef'];
}

type DynamicColor = { dynamic: { light: ColorValue; dark: ColorValue } };

function isDynamicColor(color: ColorValue): color is ColorValue & DynamicColor {
  return typeof color === 'object' && color != null && 'dynamic' in color;
}

/**
 * Converts a React Native color to the ARGB integer the native views expect.
 * `DynamicColorIOS` is resolved here for the current appearance; native-only
 * colors (`PlatformColor`) have no ARGB value and fall back to the native default.
 */
function toNativeColor(
  color: ColorValue | undefined,
  scheme: string | null | undefined,
): number | undefined {
  if (color == null) return undefined;
  if (isDynamicColor(color)) {
    return toNativeColor(
      scheme === 'dark' ? color.dynamic.dark : color.dynamic.light,
      scheme,
    );
  }
  const processed = processColor(color);
  if (typeof processed === 'number') return processed;
  if (__DEV__) {
    console.warn(
      'NitroShimmerText: PlatformColor is not supported; using the default color.',
    );
  }
  return undefined;
}

export function NitroShimmerText({
  style,
  shimmerBaseColor,
  shimmerHighlightColor,
  shimmerDuration,
  ...props
}: ShimmerTextProps) {
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const flat = StyleSheet.flatten(style) ?? {};
  const hasWidth = flat.width != null;
  const hasHeight = flat.height != null;
  const sizeStyle = useMemo<ViewStyle | null>(() => {
    if (!naturalSize) return null;
    return {
      ...(hasWidth ? {} : { width: naturalSize.width }),
      ...(hasHeight ? {} : { height: naturalSize.height }),
    };
  }, [naturalSize, hasWidth, hasHeight]);

  const onContentSizeChange = useMemo(
    () =>
      callback((width: number, height: number) => {
        setNaturalSize((prev) =>
          prev && prev.width === width && prev.height === height
            ? prev
            : { width, height },
        );
      }),
    [],
  );

  const scheme = useColorScheme();
  const baseColor = useMemo(
    () => toNativeColor(shimmerBaseColor, scheme),
    [shimmerBaseColor, scheme],
  );
  const highlightColor = useMemo(
    () => toNativeColor(shimmerHighlightColor, scheme),
    [shimmerHighlightColor, scheme],
  );

  return (
    <NitroShimmerTextNative
      {...props}
      shimmerBaseColor={baseColor}
      shimmerHighlightColor={highlightColor}
      shimmerDuration={
        shimmerDuration != null &&
        Number.isFinite(shimmerDuration) &&
        shimmerDuration > 0
          ? Math.max(1, shimmerDuration)
          : 1500
      }
      style={[style, sizeStyle]}
      onContentSizeChange={onContentSizeChange}
    />
  );
}
