import { screen } from '@react-native-harness/ui';
import { View } from 'react-native';
import { describe, expect, it, render } from 'react-native-harness';
import { NitroShimmerText } from 'react-native-nitro-shimmer-text';

const FONT_WEIGHTS = [
  'normal',
  'bold',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;

describe('NitroShimmerText mount', () => {
  it('renders with only the text prop', async () => {
    await render(
      <View testID="container">
        <NitroShimmerText text="HELLO" />
      </View>
    );
    expect(screen.queryByTestId('container')).toBeDefined();
  });

  it('renders empty text without crashing', async () => {
    await render(
      <View testID="container">
        <NitroShimmerText text="" />
      </View>
    );
    expect(screen.queryByTestId('container')).toBeDefined();
  });

  it('renders with custom colors and duration', async () => {
    await render(
      <View testID="container">
        <NitroShimmerText
          text="HELLO"
          shimmerBaseColor="#000000"
          shimmerHighlightColor="#FFD700"
          shimmerDuration={1200}
        />
      </View>
    );
    expect(screen.queryByTestId('container')).toBeDefined();
  });

  it('renders with custom fontFamily and fontSize', async () => {
    await render(
      <View testID="container">
        <NitroShimmerText
          text="HELLO"
          fontFamily="Georgia"
          fontSize={32}
        />
      </View>
    );
    expect(screen.queryByTestId('container')).toBeDefined();
  });

  it('renders with explicit width and height in style', async () => {
    await render(
      <View testID="container">
        <NitroShimmerText
          text="HELLO"
          fontSize={20}
          style={{ width: 200, height: 40 }}
        />
      </View>
    );
    expect(screen.queryByTestId('container')).toBeDefined();
  });

  it('renders with array styles', async () => {
    await render(
      <View testID="container">
        <NitroShimmerText
          text="HELLO"
          style={[{ width: 150 }, { height: 30 }]}
        />
      </View>
    );
    expect(screen.queryByTestId('container')).toBeDefined();
  });
});

describe('NitroShimmerText fontWeight', () => {
  for (const weight of FONT_WEIGHTS) {
    it(`renders with fontWeight="${weight}"`, async () => {
      await render(
        <View testID="container">
          <NitroShimmerText text="HELLO" fontWeight={weight} />
        </View>
      );
      expect(screen.queryByTestId('container')).toBeDefined();
    });
  }
});
