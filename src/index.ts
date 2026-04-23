import { getHostComponent, type HybridRef } from 'react-native-nitro-modules'
import NitroShimmerTextConfig from '../nitrogen/generated/shared/json/NitroShimmerTextConfig.json'
import type {
  NitroShimmerTextProps,
  NitroShimmerTextMethods,
} from './specs/nitro-shimmer-text.nitro'


export const NitroShimmerText = getHostComponent<NitroShimmerTextProps, NitroShimmerTextMethods>(
  'NitroShimmerText',
  () => NitroShimmerTextConfig
)

export type NitroShimmerTextRef = HybridRef<NitroShimmerTextProps, NitroShimmerTextMethods>
