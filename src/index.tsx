import React, { type ComponentProps, useMemo, useState } from 'react';

import {
  type ColorValue,
  processColor,
  StyleSheet,
  type ViewProps,
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
  /** Base text color. Accepts any React Native color. Defaults to "#808080". */
  shimmerBaseColor?: ColorValue;
  /** Shimmer highlight color. Accepts any React Native color. Defaults to "#FFFFFF". */
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

/** Converts any React Native color to the ARGB integer the native views expect. */
function toNativeColor(color: ColorValue | undefined): number | undefined {
  if (color == null) return undefined;
  const processed = processColor(color);
  return typeof processed === 'number' ? processed : undefined;
}

export function NitroShimmerText({
  style,
  shimmerBaseColor,
  shimmerHighlightColor,
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

  const baseColor = useMemo(
    () => toNativeColor(shimmerBaseColor),
    [shimmerBaseColor],
  );
  const highlightColor = useMemo(
    () => toNativeColor(shimmerHighlightColor),
    [shimmerHighlightColor],
  );

  return (
    <NitroShimmerTextNative
      {...props}
      shimmerBaseColor={baseColor}
      shimmerHighlightColor={highlightColor}
      style={[style, sizeStyle]}
      onContentSizeChange={onContentSizeChange}
    />
  );
}
