# react-native-nitro-shimmer-text

A native shimmering text view for React Native, built with [Nitro Modules](https://nitro.margelo.com). Renders a smooth gradient sweep across text on iOS (Swift / `CAGradientLayer`) and Android (Kotlin / `LinearGradient` shader) — no JS animation loop, no Reanimated/Skia required.

[![Version](https://img.shields.io/npm/v/react-native-nitro-shimmer-text.svg)](https://www.npmjs.com/package/react-native-nitro-shimmer-text)
[![Downloads](https://img.shields.io/npm/dm/react-native-nitro-shimmer-text.svg)](https://www.npmjs.com/package/react-native-nitro-shimmer-text)
[![License](https://img.shields.io/npm/l/react-native-nitro-shimmer-text.svg)](https://github.com/aparedes/react-native-nitro-shimmer-text/blob/main/LICENSE)

## Requirements

- React Native **0.78.0** or higher (required for Nitro Views)
- Node 18 or higher

## Installation

```bash
bun add react-native-nitro-shimmer-text react-native-nitro-modules
# or: npm install / yarn add / pnpm add
```

iOS:

```bash
cd ios && bundle exec pod install
```

Android: nothing extra — autolinking handles it.

## Usage

```tsx
import { NitroShimmerText } from 'react-native-nitro-shimmer-text';

export function Example() {
  return (
    <NitroShimmerText
      text="HELLO"
      fontFamily="Georgia"
      fontSize={32}
      fontWeight="bold"
      shimmerBaseColor="#000000"
      shimmerHighlightColor="#FFD700"
      shimmerDuration={1500}
    />
  );
}
```

The view auto-sizes to its text content when no explicit `width`/`height` is provided via `style`. Pass dimensions on `style` to override.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | The text to render. Required. |
| `shimmerBaseColor` | `string` (hex) | `#808080` | Base text color. |
| `shimmerHighlightColor` | `string` (hex) | `#FFFFFF` | Color of the moving highlight band. |
| `shimmerDuration` | `number` (ms) | `1500` | Duration of one shimmer sweep. |
| `fontSize` | `number` | `16` | Font size in points (iOS) / sp (Android). |
| `fontFamily` | `string` | system | Font family name. Falls back to system if unavailable. |
| `fontWeight` | `'normal' \| 'bold' \| '100'…'900'` | `'normal'` | Font weight. |
| `style` | `StyleProp<ViewStyle>` | — | Standard view style. Use `width`/`height` to override auto-sizing. |

## Credits

Bootstrapped with [create-nitro-module](https://github.com/patrickkabwe/create-nitro-module).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
