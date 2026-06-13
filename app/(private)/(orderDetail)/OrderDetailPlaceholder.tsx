import { StyleSheet, Text, View, ViewStyle } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import {
  ORDER_PAYMENT_IN_SHEET_SPACING,
  ORDER_SECTION_SPACING,
  ORDER_TRACKING_HEADING_MARGIN_BOTTOM,
  orderDetailGridStyles,
} from "./orderDetailLayout";

const gridStyles = orderDetailGridStyles;

const SkeletonBar = ({
  height = 13,
  width,
  flex,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  flex?: number;
  style?: ViewStyle;
}) => (
  <View
    style={[
      skeletonStyles.bar,
      { height },
      width != null && { width },
      flex != null && { flex },
      style,
    ]}
  />
);

export const OrderDetailBodySkeleton = ({ inSheet = false }: { inSheet?: boolean }) => (
  <>
    <View style={[styles.section, inSheet && styles.sectionInSheet]}>
      <Text style={styles.heading}>Order Detail</Text>
      <View style={gridStyles.orderDetailsGrid}>
        <View style={gridStyles.orderItemCard}>
          <View style={gridStyles.orderItemHeader}>
            <View style={gridStyles.iconContainer} />
            <SkeletonBar flex={1} height={13} />
          </View>
          <View style={[gridStyles.statusContainer, gridStyles.statusContainerSkeleton]}>
            <SkeletonBar width={88} height={14} />
          </View>
        </View>

        <View style={gridStyles.orderItemCard}>
          <View style={gridStyles.orderItemHeader}>
            <View style={gridStyles.iconContainer} />
            <SkeletonBar flex={1} height={13} />
          </View>
          <View style={gridStyles.valueSkeletonTwoLine}>
            <SkeletonBar width="90%" height={13} />
            <SkeletonBar width="75%" height={13} />
          </View>
        </View>

        <View style={[gridStyles.orderItemCard, gridStyles.fullWidthCard]}>
          <View style={gridStyles.orderItemHeader}>
            <View style={gridStyles.iconContainer} />
            <SkeletonBar width="35%" height={13} />
          </View>
          <View style={gridStyles.valueSkeletonOneLine}>
            <SkeletonBar width="55%" height={13} />
          </View>
        </View>
      </View>
    </View>

    <View
      style={[
        styles.section,
        inSheet ? styles.paymentInSheet : styles.paymentSection,
      ]}
    >
      <Text style={styles.heading}>Payment Detail</Text>
      <View style={styles.paymentCard}>
        <View style={styles.breakdownRows}>
          <SkeletonBar width="100%" height={13} />
          <SkeletonBar width="100%" height={13} />
          <SkeletonBar width="100%" height={13} />
        </View>
        <View style={styles.divider} />
        <View style={styles.paymentItem}>
          <View style={[styles.iconContainer, styles.iconTeal]}>
            <SkeletonBar width={20} height={20} />
          </View>
          <View style={styles.paymentContent}>
            <SkeletonBar width="45%" height={13} />
            <SkeletonBar width="60%" height={20} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.paymentItem}>
          <View style={[styles.iconContainer, styles.iconOrange]}>
            <SkeletonBar width={20} height={20} />
          </View>
          <View style={styles.paymentContent}>
            <SkeletonBar width="45%" height={13} />
            <SkeletonBar width="60%" height={20} />
          </View>
        </View>
      </View>
    </View>

    <View style={[styles.section, !inSheet && styles.addressSection]}>
      <Text style={styles.heading}>Address Detail</Text>
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.addressIconContainer}>
            <SkeletonBar width={24} height={24} />
          </View>
          <View style={styles.addressContent}>
            <SkeletonBar width="50%" height={13} />
            <SkeletonBar width="65%" height={20} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.addressBody}>
          <SkeletonBar width="90%" height={15} />
          <SkeletonBar width="80%" height={15} />
          <SkeletonBar width="70%" height={15} />
        </View>
      </View>
    </View>

    <View style={[styles.section, !inSheet && styles.trackingSection]}>
      <Text style={[styles.heading, styles.trackingHeading]}>Tracking Detail</Text>
      <View style={styles.trackingCard}>
        <View style={styles.trackingHeader}>
          <SkeletonBar width={24} height={24} />
          <SkeletonBar flex={1} height={13} />
        </View>
        <View style={styles.trackingTimeline}>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot}>
                <SkeletonBar width={12} height={12} />
              </View>
              <View style={styles.timelineContent}>
                <SkeletonBar width="70%" height={13} />
                <SkeletonBar width="50%" height={13} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  </>
);

const OrderDetailPlaceholder = () => <OrderDetailBodySkeleton />;

export default OrderDetailPlaceholder;

const styles = StyleSheet.create({
  section: {},
  sectionInSheet: {
    marginTop: 0,
  },
  paymentSection: {
    marginTop: ORDER_SECTION_SPACING,
  },
  paymentInSheet: {
    marginTop: ORDER_PAYMENT_IN_SHEET_SPACING,
  },
  addressSection: {
    marginTop: ORDER_SECTION_SPACING,
  },
  trackingSection: {
    marginTop: ORDER_SECTION_SPACING,
  },
  trackingHeading: {
    marginBottom: ORDER_TRACKING_HEADING_MARGIN_BOTTOM,
  },
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGrey,
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.mediumGrey,
    justifyContent: "center",
    alignItems: "center",
  },
  iconTeal: {
    backgroundColor: "#E0F7FA",
  },
  iconOrange: {
    backgroundColor: "#FFF3E0",
  },
  paymentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  breakdownRows: {
    gap: 12,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 4,
  },
  paymentContent: {
    flex: 1,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 16,
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    backgroundColor: Colors.light.lightGreen + "10",
  },
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  addressContent: {
    flex: 1,
    gap: 4,
  },
  addressBody: {
    padding: 20,
    gap: 12,
  },
  trackingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  trackingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  trackingTimeline: {
    paddingLeft: 8,
    gap: 24,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  timelineContent: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
});

const skeletonStyles = StyleSheet.create({
  bar: {
    borderRadius: 5,
    backgroundColor: "#f3f3f3",
  },
});
