import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NitroShimmerText } from 'react-native-nitro-shimmer-text';

function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <NitroShimmerText
        fontFamily="Georgia"
        fontSize={32}
        fontWeight="bold"
        text="HELLO"
        shimmerHighlightColor="#FFD700"
        shimmerBaseColor="#000000"
      />
      <NitroShimmerText
        fontFamily="Georgia"
        fontSize={32}
        fontWeight="bold"
        text="HELLO"
        shimmerHighlightColor="#FFD700"
        shimmerBaseColor="#000000"
      />
      <NitroShimmerText
        fontFamily="Georgia"
        fontSize={32}
        fontWeight="bold"
        text={'HELLO'}
        shimmerHighlightColor="#FFD700"
        shimmerBaseColor="#000000"
      />
      <NitroShimmerText
        fontFamily="Georgia"
        fontSize={32}
        fontWeight="bold"
        text="HELLO"
        shimmerHighlightColor="#FFD700"
        shimmerBaseColor="#000000"
      />
      <NitroShimmerText
        fontFamily="Georgia"
        fontSize={32}
        fontWeight="bold"
        text="HELLO"
        shimmerHighlightColor="#FFD700"
        shimmerBaseColor="#000000"
      />
      <NitroShimmerText
        fontFamily="Georgia"
        fontSize={32}
        fontWeight="bold"
        text="HELLO"
        shimmerHighlightColor="#FFD700"
        shimmerBaseColor="#000000"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
