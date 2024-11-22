import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import { Entypo } from "@expo/vector-icons";
import ContentLoader, { Rect } from "react-content-loader/native";

const RecentSearchPlaceholder = () => {
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.item}>
      <ContentLoader
        speed={2}
        width={"100%"}
        height={20}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
        style={{ padding: 10 }}
      >
        <Rect rx={5} ry={5} width={"100%"} height={40} />
      </ContentLoader>
    </TouchableOpacity>
  );
  return (
    <FlatList
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
      data={[
        { _id: "1", name: "" },
        { _id: "2", name: "" },
        { _id: "3", name: "" },
        { _id: "4", name: "" },
        { _id: "5", name: "" },
      ]}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
    />
  );
};

export default RecentSearchPlaceholder;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: 10,
    marginTop: 20,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  item: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F1F4F3",
    marginBottom: 15,
    borderRadius: 18,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    marginHorizontal: 16,
  },
  deleteIcon: {
    paddingLeft: 15,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
