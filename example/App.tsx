import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NitroShimmerText } from 'react-native-nitro-shimmer-text';

function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
        <NitroShimmerText isRed={true} style={styles.view} testID="nitro-shimmer-text" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  view: {
    width: 200,
    height: 200
  }});

export default App;