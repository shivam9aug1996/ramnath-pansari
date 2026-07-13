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
import { addressCardStyles } from "./addressListLayout";

const cardStyles = addressCardStyles;

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
  //const fullAddress = `${item.buildingName}, ${item.colonyArea}, ${item.city} - ${item.pincode}, ${item.state}`;
const fullAddress = item?.address || ''
  const handleEditPress = () => {
    dispatch(
      setCurrentAddressData({
        action: "edit",
        form: item,
        initialForm: item,
      })
    );
    // router.push("/(address)/mapSelect");
    router.push({
      pathname: "/(address)/addAddress",
    });
  };

  const handleDeletePress = async () => {
    try {
      setIsLoading(true);
      //console.log("hiiiiii");
      await deleteAddress({ userId, addressId: item._id }).unwrap();
      await fetchAddress({ userId }, false)?.unwrap();
      //console.log("byeeeee");
    } catch (error) {
      // Handle error here
      //console.log("9876tghjkl;", error);
    } finally {
      setIsLoading(false);
      onSelect();
    }
  };

  const cardStyle: StyleProp<ViewStyle> = useMemo(() => {
    return [
      cardStyles.card,
      {
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? "none" : "auto",
        borderColor: selected ? Colors.light.gradientGreen_2 : "transparent",
        borderWidth: 2,
      },
    ];
  }, [isLoading, selected]);

  const isNotServiceable = item.pincode !== "245304";

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
      {item.mapImage &&
      <View style={cardStyles.imageContainer}>
        <Image
          source={{ uri: item.mapImage || staticImage }}
          style={cardStyles.image}
        />
      </View>
}

      <View style={cardStyles.textContainer}>
        <Text style={styles.name}>{truncateText(item.name, 20)}</Text>
        <View style={cardStyles.separator} />
        <Text style={styles.address}>{truncateText(fullAddress, 150)}</Text>
        <Text style={styles.phone}>Phone: {item.phone}</Text>
        {/* <Text
          style={{
            color: isNotServiceable
              ? Colors.light.lightRed
              : Colors.light.gradientGreen_2,
            fontSize: 12,
            fontFamily: "Raleway_500Regular",
            marginTop: 4,
          }}
        >
          {isNotServiceable ? "Not serviceable" : ""}
        </Text> */}
      </View>
    </TouchableOpacity>
  );
};

export default memo(AddressItem);

const styles = StyleSheet.create({
  name: {
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
    color: "#2A2A2A",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  address: {
    fontFamily: "Raleway_500Regular",
    fontSize: 13,
    color: "#666666",
    letterSpacing: 0.3,
    lineHeight: 18,
    paddingBottom: 8,
  },
  phone: {
    fontFamily: "Montserrat_500Regular",
    fontSize: 13,
    color: Colors.light.gradientGreen_2,
    letterSpacing: 0.3,
  },
  iconStyle: {
    position: "absolute",
    right: 5,
    padding: 10,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
