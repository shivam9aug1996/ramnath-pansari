import { Colors } from "@/constants/Colors";
import { formatNumber } from "@/utils/utils";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Image } from "expo-image";

interface FreebieItem {
  name: string;
  quantity: number;
  value: number;
  image?: string; // Add image URL to the interface
}

const SavingsAndFreebies = ({
  regularSavings,
  freebies
}: {
  regularSavings: number;
  freebies: FreebieItem[];
}) => {
  const totalFreebieValue = freebies.reduce((sum, item) => sum + item.value, 0);
  const totalSavings = regularSavings + totalFreebieValue;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Savings Summary</Text>

      {totalSavings > 0 && (
        <View style={styles.totalSavingsContainer}>
          <View style={styles.circleContainer}>
            <Text style={styles.totalAmount}>₹{formatNumber(totalSavings)}</Text>
            <Text style={styles.totalLabel}>Total Saved</Text>
          </View>

          <View style={styles.breakdownContainer}>
            {regularSavings > 0 && (
              <View style={styles.breakdownItem}>
                <View style={styles.iconContainer}>
                  <Ionicons name="pricetag" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Discount Savings</Text>
                  <Text style={styles.breakdownValue}>
                    ₹{formatNumber(regularSavings)}
                  </Text>
                </View>
              </View>
            )}

            {totalFreebieValue > 0 && (
              <View style={styles.breakdownItem}>
                <View style={[styles.iconContainer, { backgroundColor: Colors.light.lightGreen }]}>
                  <Ionicons name="gift" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.breakdownLabel}>Freebies Value</Text>
                  <Text style={styles.breakdownValue}>
                    ₹{formatNumber(totalFreebieValue)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {freebies.length > 0 && (
        <View style={styles.freebiesSection}>
          <Text style={styles.sectionTitle}>Free Items</Text>
          {freebies.map((freebie, index) => (
            <View key={index} style={styles.freeItemCard}>
              <View style={styles.freeItemContent}>
                {freebie.image && (
                  <Image
                    source={{ uri: freebie.image }}
                    style={styles.freeItemImage}
                    contentFit="contain"
                  />
                )}
                <View style={styles.freeItemDetails}>
                  <View style={styles.freeItemHeader}>
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>{freebie.quantity}x</Text>
                    </View>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {freebie.name}
                    </Text>
                  </View>
                  <View style={styles.valueTag}>
                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={14}
                      color={Colors.light.mediumGrey}
                    />
                    <Text style={styles.valueText}>
                      Worth ₹{formatNumber(freebie.value)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    paddingHorizontal: 4,
  },
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 22,
    color: Colors.light.darkGreen,
    marginBottom: 20,
  },
  totalSavingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalAmount: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 32,
    color: Colors.light.lightGreen,
  },
  totalLabel: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGrey,
    marginTop: 4,
  },
  breakdownContainer: {
    gap: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
  },
  breakdownValue: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 16,
    color: Colors.light.darkGrey,
  },
  freebiesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 18,
    color: Colors.light.darkGrey,
    marginBottom: 16,
  },
  freeItemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  freeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freeItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  freeItemDetails: {
    flex: 1,
  },
  freeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  quantityBadge: {
    backgroundColor: Colors.light.lightGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: Colors.light.lightGreen,
  },
  itemName: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
    flex: 1,
  },
  valueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
});

export default memo(SavingsAndFreebies);