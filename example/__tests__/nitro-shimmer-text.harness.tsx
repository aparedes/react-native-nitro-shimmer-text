import { screen } from '@react-native-harness/ui';
import type { LayoutChangeEvent, LayoutRectangle } from 'react-native';
import { describe, expect, it, render, waitFor } from 'react-native-harness';
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

const TEST_ID = 'shimmer';

/** Observe actual native layout in points/dp, including asynchronous auto-sizing. */
function observeLayout() {
  let layout: LayoutRectangle | undefined;
  return {
    onLayout: (event: LayoutChangeEvent) => {
      layout = event.nativeEvent.layout;
    },
    getSize: (assertSize?: (size: LayoutRectangle) => void) =>
      waitFor(
        () => {
          if (!layout) throw new Error('Waiting for native layout');
          expect(layout.width).toBeGreaterThan(0);
          expect(layout.height).toBeGreaterThan(0);
          assertSize?.(layout);
          return layout;
        },
        { timeout: 3000 },
      ),
  };
}

describe('NitroShimmerText mount', () => {
  it('auto-sizes to its text with only the text prop', async () => {
    const layout = observeLayout();
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        onLayout={layout.onLayout}
      />,
    );
    await layout.getSize();
  });

  it('renders empty text without crashing', async () => {
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text=""
        style={{ width: 10, height: 10 }}
      />,
    );
    expect(await screen.findByTestId(TEST_ID)).not.toBeNull();
  });

  it('renders with custom colors and duration', async () => {
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        shimmerBaseColor="#000000"
        shimmerHighlightColor="gold"
        shimmerDuration={1200}
      />,
    );
    expect(await screen.findByTestId(TEST_ID)).not.toBeNull();
  });

  it('grows with a larger fontSize', async () => {
    const layout = observeLayout();
    const { rerender } = await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        onLayout={layout.onLayout}
      />,
    );
    const small = await layout.getSize();
    await rerender(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        fontSize={32}
        onLayout={layout.onLayout}
      />,
    );
    await layout.getSize((large) => {
      expect(large.width).toBeGreaterThan(small.width);
      expect(large.height).toBeGreaterThan(small.height);
    });
  });

  it('respects explicit width and height in style', async () => {
    const layout = observeLayout();
    const { rerender } = await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        fontSize={20}
        style={{ width: 200, height: 40 }}
        onLayout={layout.onLayout}
      />,
    );
    await layout.getSize((wide) => {
      expect(wide.width).toBeCloseTo(200, 0);
      expect(wide.height).toBeCloseTo(40, 0);
    });
    await rerender(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        fontSize={20}
        style={[{ width: 100 }, { height: 20 }]}
        onLayout={layout.onLayout}
      />,
    );
    await layout.getSize((half) => {
      expect(half.width).toBeCloseTo(100, 0);
      expect(half.height).toBeCloseTo(20, 0);
    });
  });

  it('exposes its text to accessibility services', async () => {
    await render(<NitroShimmerText testID={TEST_ID} text="HELLO A11Y" />);
    expect(await screen.findByAccessibilityLabel('HELLO A11Y')).not.toBeNull();
  });
});

describe('NitroShimmerText fontWeight', () => {
  for (const weight of FONT_WEIGHTS) {
    it(`renders with fontWeight="${weight}"`, async () => {
      await render(
        <NitroShimmerText testID={TEST_ID} text="HELLO" fontWeight={weight} />,
      );
      expect(await screen.findByTestId(TEST_ID)).not.toBeNull();
    });
  }
});
