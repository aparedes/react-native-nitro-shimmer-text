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

export interface ShimmerTextProps {
  /** The text to display. */
  text: string;
  /** Base text color as a hex string (e.g. "#808080"). Defaults to "#808080". */
  shimmerBaseColor?: string;
  /** Shimmer highlight color as a hex string (e.g. "#FFFFFF"). Defaults to "#FFFFFF". */
  shimmerHighlightColor?: string;
  /** Shimmer sweep duration in milliseconds. Defaults to 1500. */
  shimmerDuration?: number;
  /** Font size in points/sp. Defaults to 16. */
  fontSize?: number;
  /** Font family name (e.g. "Georgia", "Courier"). Falls back to system font if not found. */
  fontFamily?: string;
  /** Font weight. Defaults to "normal". */
  fontWeight?: FontWeight;
}
export interface NitroShimmerTextProps
  extends HybridViewProps,
    ShimmerTextProps {
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
