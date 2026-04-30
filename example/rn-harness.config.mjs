import {
  androidEmulator,
  androidPlatform,
} from "@react-native-harness/platform-android";
import {
  applePlatform,
  appleSimulator,
} from "@react-native-harness/platform-apple";

export default {
  entryPoint: "./index.js",
  appRegistryComponentName: "NitroShimmerTextExample",

  runners: [
    androidPlatform({
      name: "medium_phone_api_36.1",
      device: androidEmulator("Medium_Phone_API_36.1"),
      bundleId: "com.nitroshimmertextexample",
    }),
    applePlatform({
      name: "iphone-17",
      device: appleSimulator("iPhone 17", "26.3"),
      bundleId: "com.nitroshimmertextexample",
    }),
  ],
  defaultRunner: "iphone-17",
};
