import { screen } from "@react-native-harness/ui";
import { View } from "react-native";
import { describe, expect, it, render, waitFor } from "react-native-harness";
import { NitroShimmerText } from "react-native-nitro-shimmer-text";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SHIMMER_DURATION = 2000;

const TIMINGS = [
  { name: "enter", delayMs: 400 },
  { name: "center", delayMs: 800 },
  { name: "exit", delayMs: 1200 },
] as const;

const CASES = [
  {
    name: "default",
    render: () => (
      <NitroShimmerText text="HELLO" shimmerDuration={SHIMMER_DURATION} />
    ),
  },
  {
    name: "custom-colors",
    render: () => (
      <NitroShimmerText
        text="HELLO"
        shimmerBaseColor="#000000"
        shimmerHighlightColor="#FFD700"
        shimmerDuration={SHIMMER_DURATION}
      />
    ),
  },
  {
    name: "custom-font",
    render: () => (
      <NitroShimmerText
        text="HELLO"
        fontFamily="Georgia"
        fontWeight="bold"
        fontSize={32}
        shimmerDuration={SHIMMER_DURATION}
      />
    ),
  },
] as const;

describe("NitroShimmerText visual snapshots", () => {
  for (const c of CASES) {
    for (const t of TIMINGS) {
      it(`${c.name} at ${t.name}`, async () => {
        await render(<View testID="shimmer-wrap">{c.render()}</View>);
        const element = await waitFor(() => {
          const el = screen.queryByTestId("shimmer-wrap");
          expect(el).toBeDefined();
          return el;
        });
        // Small warmup so the CAAnimation has started before the timing clock runs.
        await sleep(100);
        await sleep(t.delayMs);
        const shot = await screen.screenshot(element);
        await expect(shot).toMatchImageSnapshot({
          name: `shimmer-${c.name}-${t.name}`,
        });
      });
    }
  }
});
