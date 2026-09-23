import { screen } from '@react-native-harness/ui';
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

const TEST_ID = 'shimmer';

/** Asserts the shimmer view is mounted and returns its rendered size in pixels. */
async function getRenderedSize() {
  const element = await screen.findByTestId(TEST_ID);
  const shot = await screen.screenshot(element);
  expect(shot).not.toBeNull();
  return { width: shot?.width ?? 0, height: shot?.height ?? 0 };
}

describe('NitroShimmerText mount', () => {
  it('auto-sizes to its text with only the text prop', async () => {
    await render(<NitroShimmerText testID={TEST_ID} text="HELLO" />);
    const size = await getRenderedSize();
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  it('renders empty text without crashing', async () => {
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text=""
        style={{ width: 10, height: 10 }}
      />
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
      />
    );
    expect(await screen.findByTestId(TEST_ID)).not.toBeNull();
  });

  it('grows with a larger fontSize', async () => {
    await render(<NitroShimmerText testID={TEST_ID} text="HELLO" />);
    const small = await getRenderedSize();
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        fontFamily="Georgia"
        fontSize={32}
      />
    );
    const large = await getRenderedSize();
    expect(large.height).toBeGreaterThan(small.height);
  });

  it('respects explicit width and height in style', async () => {
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        fontSize={20}
        style={{ width: 200, height: 40 }}
      />
    );
    const wide = await getRenderedSize();
    await render(
      <NitroShimmerText
        testID={TEST_ID}
        text="HELLO"
        fontSize={20}
        style={[{ width: 100 }, { height: 20 }]}
      />
    );
    const half = await getRenderedSize();
    expect(half.width).toBeLessThan(wide.width);
    expect(half.height).toBeLessThan(wide.height);
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
        <NitroShimmerText testID={TEST_ID} text="HELLO" fontWeight={weight} />
      );
      expect(await screen.findByTestId(TEST_ID)).not.toBeNull();
    });
  }
});
