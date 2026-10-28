# Research: audit branch and CI

**Date:** 2026-09-23 · **Branch:** claude/code-audit-u1o8a9 · **Commit:** a1bff21

## Question

“this branch is an audit of the code. you should also audit it, after that we need to fix the ci”

## Current implementation

- `NitroShimmerText()` in `src/index.tsx:65` converts colors with `processColor`, forwards ViewProps, and stores natural dimensions reported through a memoized Nitro callback (`:87`). It adds width/height only when those dimensions are absent from the flattened style (`:76-85`). `toNativeColor()` at `:59` retains only numeric processed colors.
- `NitroShimmerTextProps` in `src/specs/nitro-shimmer-text.nitro.ts:24` drives generated native bindings. Generated iOS `updateProps` assigns the content-size callback before invoking `afterUpdate()` (`nitrogen/generated/ios/c++/views/HybridNitroShimmerTextComponent.mm:122-128`). Generated files are regenerated via `bun run codegen`, then patched by `post-script.js`.
- iOS `ShimmerLabel` uses two centered single-line labels with a gradient mask (`ios/HybridNitroShimmerText.swift:60-83`). `reportContentSize()` at `:203` measures the base label and only emits positive dimensions. `updateAnimationState()` at `:119` accounts for attachment, empty text, width, and Reduce Motion.
- Android `ShimmerTextView.ensureMeasurements()` at `android/src/main/java/com/nitroshimmertext/HybridNitroShimmerText.kt:98` ellipsizes text to the current width. `onDraw()` at `:188` paints the base and moving highlight. `afterUpdate()` at `:293` converts natural pixel dimensions to dp, emitting only nonzero dimensions. Font setup uses SP/DIP and ReactFontManager (`:301-329`).

## CI and test flow

- Android build uses `android-actions/setup-android@v3` without package overrides (`.github/workflows/android-build.yml:55-56`), followed by Gradle `assembleDebug` (`:68-70`). Run 35821249719 fails in SDK setup: `Failed to find package 'tools'`; Gradle never starts.
- Harness builds an app for each platform and runs `example/__tests__/nitro-shimmer-text.harness.tsx`. Run 35821249720 builds both apps successfully, then fails the same three sizing tests on both platforms; 14 other tests pass on each platform.
- `getRenderedSize()` at `example/__tests__/nitro-shimmer-text.harness.tsx:22` reads `screen.screenshot(element).width/height`. Installed `@react-native-harness/ui/src/screen.ts` initializes those fields to zero for element references and only fills them for explicit bounding boxes. Screenshot capture can also precede the asynchronous auto-size update.
- Harness `render()` resolves after React commit; its returned `rerender()` preserves the mounted component (`node_modules/@react-native-harness/runtime/src/render/index.ts:15,52`). `waitFor()` retries assertions with a bounded timeout (`node_modules/@react-native-harness/runtime/src/waitFor.ts:26`). Native `onLayout` provides measured layout independently of screenshot metadata.
- Root typecheck covers library sources only (`tsconfig.json`, include); the example has a separate TypeScript config. Baseline root lint, library typecheck, and example typecheck pass locally.

## Integration and change locations

CI repair touches Android SDK package selection, device-test measurement and synchronization, and workflow coverage of dependency/configuration changes. The existing real-device assertions and both native platforms remain part of validation. No generated bridge edits are required for those repairs.

## Open questions

- What behavior should the public ColorValue contract provide for object-valued PlatformColor/DynamicColorIOS inputs?
- Should clearing text reset natural dimensions to zero? Both native implementations currently suppress that callback.
- How should invalid/nonpositive shimmerDuration values be handled? Native setters currently pass them through to animation APIs.

## Evidence

- PR: https://github.com/aparedes/react-native-nitro-shimmer-text/pull/33
- Android build: https://github.com/aparedes/react-native-nitro-shimmer-text/actions/runs/35821249719
- Device tests: https://github.com/aparedes/react-native-nitro-shimmer-text/actions/runs/35821249720
- SDK action inputs: https://github.com/android-actions/setup-android/blob/v3/action.yml

Line references describe the commit above, before the CI repairs.

## Follow-up: upgraded working tree and device validation

The user upgraded the workspace to React Native 0.87.1 and Nitro 0.37.1 while the audit was paused, with Oxc replacing Biome and an iOS scene lifecycle. The resumed audit preserves those edits and is recorded in `audit.md` next to this document. The library build and both TypeScript projects pass. A fresh Debug simulator build succeeds and all 17 repaired iOS Harness tests pass; two temporary probes reproduced the color and empty-text questions above as defects. CI now also checks example types and triggers device tests for dependency, runner, and example-native configuration changes.
