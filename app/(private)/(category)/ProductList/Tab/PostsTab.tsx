import React, { memo } from "react";
import { FlatList, Text, StyleSheet, View } from "react-native";

const SlowPost = ({ index }) => {
  let startTime = performance.now();
  while (performance.now() - startTime < 1) {
    // Simulate slow rendering
  }

  return (
    <View style={styles.post}>
      <Text>Post #{index + 1}</Text>
    </View>
  );
};

const PostsTab = memo(() => {
  const data = Array.from({ length: 10000 }, (_, i) => i);

  // return (
  //   <FlatList
  //     data={data}
  //     renderItem={({ item }) => {
  //       return <Text key={item}>{item}</Text>;
  //     }}
  //   />
  // );

  return data?.map((item, index) => {
    return <Text key={item}>{item}</Text>;
  });
});

export default PostsTab;

const styles = StyleSheet.create({
  post: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});
