import { StyleSheet, View, Text } from "react-native";
import PagerView from "react-native-pager-view";

export default function MyPager() {
  return (
    <View style={styles.container}>
      <PagerView
        style={styles.container}
        initialPage={0}
        overScrollMode={"always"}
      >
        <View style={styles.page} key="1">
          <Text>First page</Text>
          <Text>Swipe ➡️</Text>
        </View>
        <View style={styles.page} key="2">
          <Text>Second page</Text>
        </View>
        <View style={styles.page} key="3">
          <Text>Third page</Text>
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 400,
  },
  page: {
    justifyContent: "center",
    alignItems: "center",
  },
});
