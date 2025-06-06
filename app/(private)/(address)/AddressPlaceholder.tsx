import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";

import ContentLoader, { Rect } from "react-content-loader/native";

const renderImageLoader = () => {
  return (
    <ContentLoader
      speed={1}
      height={88}
      width={88}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
      style={{
        minHeight: 88,
        minWidth: 88,
        borderRadius: 18,
      }}
    >
      <Rect rx={5} ry={5} width="88" height="88" />
    </ContentLoader>
  );
};

const renderText = () => {
  return (
    <ContentLoader
      speed={1}
      width={"100%"}
      height={20}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="90%" y={0} rx={5} ry={5} height="10" />
    </ContentLoader>
  );
};

const AddressPlaceholder = () => {
  const renderAddressItem = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.card} key={item?._id || index}>
      <View style={styles.imageContainer}>{renderImageLoader()}</View>
      <View style={styles.textContainer}>
        {renderText()}
        <View style={styles.separator} />
        {renderText()}
        {renderText()}
      </View>
    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      <FlatList
      bounces={Platform.OS === "android" ? false : true}
        data={[
          { _id: "1", name: "", city: "" },
          { _id: "2", name: "", city: "" },
        ]}
        keyExtractor={(item) => item._id}
        renderItem={renderAddressItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: 20 }}
      />
    </View>
  );
};

export default AddressPlaceholder;

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 10,
  },
  card: {
    backgroundColor: Colors.light.softGrey_1,
    padding: 6,
    borderRadius: 23,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 50,
    paddingBottom: 15,
  },
  imageContainer: {
    flex: 0.5,
    marginRight: 20,
    padding: 5,
    borderRadius: 18,
  },
  image: {
    borderRadius: 18,
    // height: 88,
    // width: 88,
    minHeight: 88,
    minWidth: 88,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 5,
  },
  name: {
    fontFamily: "Raleway_700Bold",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  separator: {
    backgroundColor: Colors.light.darkGrey,
    height: 0.5,
    marginVertical: 5,
    opacity: 0.09,
  },
  address: {
    fontFamily: "Raleway_400Regular",
    fontSize: 11,
    color: Colors.light.mediumLightGrey,

    letterSpacing: 0.8,
    paddingBottom: 5,
  },
  phone: {
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
    color: Colors.light.mediumLightGrey,
    letterSpacing: 1,
  },

  iconStyle: {
    position: "absolute",
    right: 5,
    padding: 10,
    zIndex: 10,
  },
});
