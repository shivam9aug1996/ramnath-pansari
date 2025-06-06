import React, { memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from "@/constants/Colors";

interface AddressData {
  name: string;
  phone: string;
  buildingName: string;
  colonyArea: string;
  city: string;
  state: string;
  pincode: string;
  mapImage?: string;
}

interface AddressItemProps {
  addressData?: AddressData;
}

const AddressItem = ({ addressData }: AddressItemProps) => {
  if (!addressData) return null;
  console.log("addressData---->", addressData);

  return (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={Colors.light.gradientGreen_1}
          />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.deliveryLabel}>Delivery Address</Text>
          <Text style={styles.name}>{addressData.name}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.addressContent}>
        <View style={styles.contactInfo}>
          <MaterialCommunityIcons
            name="phone"
            size={16}
            color={Colors.light.mediumGrey}
          />
          <Text style={styles.phone}>{addressData.phone}</Text>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.addressLine}>
            <MaterialCommunityIcons
              name="home-outline"
              size={16}
              color={Colors.light.mediumGrey}
            />
            <Text style={styles.addressText}>
              {addressData.buildingName}, {addressData.colonyArea}
            </Text>
          </View>

          <View style={styles.addressLine}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color={Colors.light.mediumGrey}
            />
            <Text style={styles.cityText}>
              {addressData.city}, {addressData.state} - {addressData.pincode}
            </Text>
          </View>
        </View>

        {addressData.mapImage && (
          <View style={styles.mapContainer}>
            <Image
              source={{ uri: addressData.mapImage }}
              style={styles.mapImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: Colors.light.lightGreen + '10',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
  },
  name: {
    fontFamily: "Raleway_700Bold",
    fontSize: 18,
    color: Colors.light.darkGrey,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  addressContent: {
    padding: 20,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  phone: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
  },
  locationInfo: {
    gap: 12,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: "baseline",
    gap: 8,
  },
  addressText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
    color: Colors.light.darkGrey,
    flex: 1,
    lineHeight: 22,
  },
  cityText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.mediumGrey,
    flex: 1,
    lineHeight: 20,
  },
  mapContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 150,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});

export default memo(AddressItem);
