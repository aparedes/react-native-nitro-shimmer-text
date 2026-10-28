import type {
  HybridView,
  HybridViewMethods,
  HybridViewProps,
} from 'react-native-nitro-modules';

export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';

/**
 * Props received by the native view. Colors arrive pre-processed by the JS wrapper
 * (`processColor`), so both platforms get the same 32-bit ARGB integer.
 */
export interface NitroShimmerTextProps extends HybridViewProps {
  /** The text to display. */
  text: string;
  /** Base text color as a processed ARGB color. Defaults to #808080. */
  shimmerBaseColor?: number;
  /** Shimmer highlight color as a processed ARGB color. Defaults to #FFFFFF. */
  shimmerHighlightColor?: number;
  /** Shimmer sweep duration in milliseconds. Defaults to 1500. */
  shimmerDuration?: number;
  /** Font size in points (iOS) / sp (Android). Defaults to 16. */
  fontSize?: number;
  /** Font family name. Falls back to the system font if not found. */
  fontFamily?: string;
  /** Font weight. Defaults to "normal". */
  fontWeight?: FontWeight;
  /** Whether the font scales with the system text size setting. Defaults to true. */
  allowFontScaling?: boolean;
  /**
   * Fires with the natural text dimensions whenever text or font props change.
   * Used internally by the JS wrapper to auto-size the view when no explicit dimensions are given.
   */
  onContentSizeChange?: (width: number, height: number) => void;
}

export interface NitroShimmerTextMethods extends HybridViewMethods {}

export type NitroShimmerText = HybridView<
  NitroShimmerTextProps,
  NitroShimmerTextMethods,
  { ios: 'swift'; android: 'kotlin' }
>;
