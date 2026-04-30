import React, { useCallback, useState } from 'react';

import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import {
  callback,
  getHostComponent,
  type HybridRef,
} from 'react-native-nitro-modules';
import NitroShimmerTextConfig from '../nitrogen/generated/shared/json/NitroShimmerTextConfig.json';
import type {
  NitroShimmerTextMethods,
  NitroShimmerTextProps,
  ShimmerTextProps,
} from './specs/nitro-shimmer-text.nitro';

const NitroShimmerTextNative = getHostComponent<
  NitroShimmerTextProps,
  NitroShimmerTextMethods
>('NitroShimmerText', () => NitroShimmerTextConfig);

export type NitroShimmerTextRef = HybridRef<
  NitroShimmerTextProps,
  NitroShimmerTextMethods
>;

// style is not part of NitroShimmerTextProps — it lives on ViewProps at the host component level
interface PublicProps extends ShimmerTextProps {
  style?: StyleProp<ViewStyle>;
}

export function NitroShimmerText({ style, ...props }: PublicProps) {
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const flat = StyleSheet.flatten(style) ?? {};
  const sizeStyle: ViewStyle = {
    ...('width' in flat ? {} : naturalSize ? { width: naturalSize.width } : {}),
    ...('height' in flat
      ? {}
      : naturalSize
        ? { height: naturalSize.height }
        : {}),
  };

  const naturalSizeCallback = useCallback((w: number, h: number) => {
    setNaturalSize((prev) =>
      prev && prev.width === w && prev.height === h
        ? prev
        : { width: w, height: h }
    );
  }, []);

  return (
    <NitroShimmerTextNative
      {...props}
      style={[style, sizeStyle]}
      onContentSizeChange={callback(naturalSizeCallback)}
    />
  );
}
