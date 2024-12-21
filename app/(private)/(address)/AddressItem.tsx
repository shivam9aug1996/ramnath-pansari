import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import React, { memo, useState, FC, useMemo, useEffect } from "react";
import { Colors } from "@/constants/Colors";
import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  setCurrentAddressData,
  useDeleteAddressMutation,
  useLazyFetchAddressQuery,
} from "@/redux/features/addressSlice";
import { Image } from "expo-image";
import { truncateText } from "@/utils/utils";
import { staticImage } from "../(category)/CategoryList/utils";
import { useDispatch } from "react-redux";

interface AddressItemProps {
  item: {
    _id: string;
    buildingName: string;
    colonyArea: string;
    city: string;
    pincode: string;
    state: string;
    mapImage: string;
    name: string;
    phone: string;
  };
  userId: string | undefined;
  onSelect: any;
  selected: boolean;
  checkoutFlow: boolean;
}

const AddressItem: FC<AddressItemProps> = ({
  item,
  userId,
  onSelect,
  selected,
  checkoutFlow,
  disabled,
}) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteAddress] = useDeleteAddressMutation();
  const [fetchAddress] = useLazyFetchAddressQuery();

  const fullAddress = `${item.buildingName}, ${item.colonyArea}, ${item.city} - ${item.pincode}, ${item.state}`;

  const handleEditPress = () => {
    dispatch(
      setCurrentAddressData({
        action: "edit",
        form: item,
        initialForm: item,
      })
    );
    router.push("/(address)/mapSelect");
  };

  const handleDeletePress = async () => {
    try {
      setIsLoading(true);
      console.log("hiiiiii");
      await deleteAddress({ userId, addressId: item._id }).unwrap();
      await fetchAddress({ userId }, false)?.unwrap();
      console.log("byeeeee");
    } catch (error) {
      // Handle error here
      console.log("9876tghjkl;", error);
    } finally {
      setIsLoading(false);
      onSelect();
    }
  };

  const cardStyle: StyleProp<ViewStyle> = useMemo(() => {
    return [
      styles.card,
      {
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? "none" : "auto",
        borderColor: selected ? Colors.light.gradientGreen_2 : "transparent",
        borderWidth: 2,
      },
    ];
  }, [isLoading, selected]);

  return (
    <TouchableOpacity
      onPress={() => onSelect(item._id)}
      disabled={!checkoutFlow || disabled}
      style={cardStyle}
    >
      <Feather
        disabled={disabled}
        onPress={handleEditPress}
        name="edit"
        size={16}
        color={Colors.light.darkGrey}
        style={[styles.iconStyle, { top: 5 }]}
      />
      <MaterialIcons
        disabled={disabled}
        onPress={handleDeletePress}
        name="delete-outline"
        size={18}
        color={Colors.light.darkGrey}
        style={[styles.iconStyle, { bottom: 5 }]}
      />
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.mapImage || staticImage }}
          style={styles.image}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{truncateText(item.name, 20)}</Text>
        <View style={styles.separator} />
        <Text style={styles.address}>{truncateText(fullAddress, 150)}</Text>
        <Text style={styles.phone}>Phone: {item.phone}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(AddressItem);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.softGrey_1,
    padding: 6,
    borderRadius: 23,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 30,
  },
  imageContainer: {
    flex: 0.5,
    marginRight: 20,
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
    opacity: 0.1,
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
