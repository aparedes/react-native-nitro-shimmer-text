# Code audit

Reviewed 2026-09-23: branch `claude/code-audit-u1o8a9`, including the working-tree upgrade to React Native 0.87.1 / Nitro 0.37.1. Component findings below are separate from the CI repairs. No library behavior has been changed by this audit.

## Findings

### P1: Published compiled entry points cannot resolve their generated config

`src/index.tsx:15` imports `../nitrogen/generated/shared/json/NitroShimmerTextConfig.json`. Bob preserves that relative import in `lib/commonjs/index.js` and `lib/module/index.js`. From those directories it resolves to **lib/nitrogen**, but the package includes the JSON under **nitrogen/** at its root. Both `main` and `module` in `package.json:5-6` therefore lead to an unresolved dependency for consumers that select the compiled entry points.

Reproduced with `bun run build` followed by `npm pack --dry-run --ignore-scripts`: the package contains the root generated JSON, and neither compiled relative target exists. The example aliases the package to `src/index` in `example/babel.config.js`, so its build and tests cannot catch this defect. Consumers selecting the `react-native` source entry remain unaffected. This predates the current audit commits but remains a release defect.

### P2: The advertised ColorValue API silently drops dynamic/platform colors

`src/index.tsx:37-40` accepts `ColorValue` and promises any React Native color. However, `toNativeColor()` at `:59-62` returns `undefined` whenever `processColor()` returns an object. React Native deliberately returns objects for `PlatformColor(...)` and `DynamicColorIOS(...)`. Both native implementations then substitute defaults.

Example: `shimmerBaseColor={DynamicColorIOS({light: 'red', dark: 'blue'})}` yields default gray on iOS, not the requested color in either appearance. Platform colors are affected on both platforms. Supporting these values requires an appropriate native representation/resolution path; otherwise the public type and documentation need to accurately restrict supported colors.

**Device reproduction:** on iOS 27 / iPhone 17, rendered `DynamicColorIOS({light: 'red', dark: 'red'})`, obtained the native hybrid ref, and checked its `shimmerBaseColor`. Actual value: `undefined`; expected processed red: `4294901760`. The native ref was present, so this was not a mounting failure.

### P2: Clearing text leaves the old auto-sized footprint

iOS `reportContentSize()` returns without notifying JS for a zero width or height (`ios/HybridNitroShimmerText.swift:203-209`). Android does the same in `afterUpdate()` (`android/src/main/java/com/nitroshimmertext/HybridNitroShimmerText.kt:293-298`). The JS wrapper retains the last `naturalSize` and continues applying it (`src/index.tsx:71-85`).

Render a nonempty auto-sized label, then rerender that same component with `text=""`: the text disappears, but the view retains its previous width and height, leaving a gap in surrounding layout. The existing empty-text test mounts a fresh view with explicit 10×10 dimensions, so it misses this transition. Both guards predate the current branch changes.

**Device reproduction:** rendered `text="HELLO"`, waited for a positive native `onLayout` width, rerendered `text=""`, and polled for zero width for two seconds. Actual width remained **50 points**. The expected-zero assertion failed on the simulator.

### P2: Native duration values are unchecked

The public `shimmerDuration?: number` passes directly to native animation setters. Android converts it to Long (`android/src/main/java/com/nitroshimmertext/HybridNitroShimmerText.kt:261`) and passes it to `ValueAnimator.duration` (`:78,153`). A negative duration is rejected by the Android animation API. Invalid calculated values can therefore raise a native exception rather than use the default. iOS similarly forwards the value (`ios/HybridNitroShimmerText.swift:167-168,136`). This is a source-level finding; deliberately crashing the running app was not needed for the audit.

### P2 (fixed locally): Harness workflow misses dependency and runner-config changes

The path filters in `.github/workflows/harness-tests.yml:11-31` omit `bun.lock`, `example/rn-harness.config.mjs`, `example/jest.harness.config.mjs`, Babel/Metro configs, and example native projects. A lockfile-only dependency update or runner change can bypass both device jobs. The push filter also omits both package manifests, unlike the PR filter.

Expanded both filters to include those inputs, enforced the lockfile in device jobs, and added example/device-test typechecking to the fast CI job. The line references in this finding describe the pre-repair workflow.

## CI failure diagnosis and local repairs

- Android build run 35821249719 fails before Gradle because setup-android v3 defaults include the unavailable SDK `tools` package. Added explicit `packages: platform-tools`, an input supported by the action.
- Both platforms in Harness run 35821249720 build successfully and then fail the same three sizing assertions. Harness UI 1.1.0 returns width/height zero for element screenshots; it only fills them when a caller supplies a bounding box. Replaced screenshot metadata with real native `onLayout` events and bounded assertion polling. Font-size and explicit-size tests now use `rerender()` to exercise updates on the same mounted view; explicit sizes are checked against their requested values.
- Added optional local simulator-version and Metro-port environment overrides to Harness config; CI defaults remain iOS 26.4 / port 8081.

## Validation

- Library build, root typecheck, example typecheck, lint, and formatting check passed on the upgraded working tree.
- Package dry-run reproduced the missing config target in both compiled entry points.
- The installed iPhone 17 app displayed the six example labels and a visible gold shimmer. Initial Harness validation did not execute tests: the bundled app never requested the test Metro bundle, despite a healthy server. A fresh Debug build succeeded; after installing it, **all 17 normal Harness tests passed** (6.4 seconds) on iOS 27 / iPhone 17.
- Two temporary targeted audit probes both failed as expected, reproducing stale empty-text width and dropped dynamic color (details above). They were removed after recording the evidence; they are not disabled tests added to the normal suite.
- Android Debug APK build passed locally on React Native 0.87.1 (`:app:assembleDebug`, arm64-v8a). No Android emulator was connected during this pass, so the repaired Android device assertions still require a CI run. Historical Android CI logs confirm its native build succeeded before the sizing-test failures.

## Evidence

- [PR #33](https://github.com/aparedes/react-native-nitro-shimmer-text/pull/33)
- [Android build failure](https://github.com/aparedes/react-native-nitro-shimmer-text/actions/runs/35821249719)
- [Both device test failures](https://github.com/aparedes/react-native-nitro-shimmer-text/actions/runs/35821249720)
- [SDK action v3 inputs](https://github.com/android-actions/setup-android/blob/v3/action.yml)
