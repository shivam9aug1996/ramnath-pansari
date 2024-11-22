import { FlatList, StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import { ThemedView } from "../ThemedView";
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
      height={100}
      backgroundColor="#f3f3f3"
      foregroundColor="#e3e3e3"
    >
      <Rect width="90%" y={0} rx={5} ry={5} height="10" />
      <Rect width="90%" y={20} rx={5} ry={5} height="10" />
      <Rect width="90%" y={40} rx={5} ry={5} height="10" />
    </ContentLoader>
  );
};

const CartPlaceholder = () => {
  const renderItem = ({ item }: any) => {
    return (
      <>
        <ThemedView style={[styles.container]}>
          <View style={styles.imageContainer}>{renderImageLoader()}</View>
          <View style={styles.detailsContainer}>{renderText()}</View>
        </ThemedView>
      </>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={[1, 2, 3]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={renderItem}
        keyExtractor={(item, index) => item || index}
      />
    </View>
  );
};

export default CartPlaceholder;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 37,
    alignItems: "center",
    paddingBottom: 17,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Raleway_700Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "Montserrat_400Regular",
  },
  listContainer: {
    gap: 18,
    marginTop: 12,
    paddingBottom: 20,
    paddingTop: 5,

    // flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.mediumLightGrey,
    marginHorizontal: 34,
    opacity: 0.15,
    marginVertical: 25,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 14,
  },
  totalAmount: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 22,
    color: Colors.light.lightGreen,
  },
  footerSpace: {
    // flex: 1,
    //  marginBottom: Platform.OS === "android" ? tabBarHeight : 15,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F4F3",
    padding: 20,
    borderRadius: 23,
    flex: 1,
    justifyContent: "flex-start",
  },
  imageContainer: {
    flex: 0.35,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  detailsContainer: {
    justifyContent: "space-evenly",
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  unitPrice: {
    fontSize: 11,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
    marginVertical: 3,
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
});
