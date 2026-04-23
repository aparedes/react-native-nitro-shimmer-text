import type {
  HybridView,
  HybridViewProps,
  HybridViewMethods,
} from 'react-native-nitro-modules'

export interface NitroShimmerTextProps extends HybridViewProps {
   isRed: boolean
}

export interface NitroShimmerTextMethods extends HybridViewMethods {}

export type NitroShimmerText = HybridView<NitroShimmerTextProps, NitroShimmerTextMethods, { ios: 'swift', android: 'kotlin' }>