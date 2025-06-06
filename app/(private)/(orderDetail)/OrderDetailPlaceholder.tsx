import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";
import ContentLoader, { Rect } from "react-content-loader/native";

const LoaderBlock = ({ width = "100%", height = 13 }) => (
  <ContentLoader
    speed={1}
    width={width}
    height={height}
    backgroundColor="#f3f3f3"
    foregroundColor="#e3e3e3"
  >
    <Rect width={width} y={0} rx={5} ry={5} height={height} />
  </ContentLoader>
);

const OrderDetailPlaceholder = () => {
  return (
    <View>
      {/* Order Detail Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Order Detail</Text>
        <View style={styles.orderDetailsGrid}>
          {/* Status Card */}
          <View style={[styles.orderItemCard, { width: '100%' }]}>
            <View style={styles.orderItemHeader}>
              <View style={styles.iconContainer}>
                {/* <LoaderBlock width={18} height={18} /> */}
              </View>
              <LoaderBlock width={80} />
            </View>
            <View style={styles.statusContainer}>
              <LoaderBlock width={100} height={20} />
            </View>
          </View>

          {/* Purchase Date Card */}
          <View style={styles.orderItemCard}>
            <View style={styles.orderItemHeader}>
              <View style={styles.iconContainer}>
                {/* <LoaderBlock width={18} height={18} /> */}
              </View>
              <LoaderBlock width={80} />
            </View>
            <LoaderBlock width={120} height={45} />
          </View>

          {/* Order ID Card */}
          <View style={styles.orderItemCard}>
            <View style={styles.orderItemHeader}>
              <View style={styles.iconContainer}>
                {/* <LoaderBlock width={18} height={18} /> */}
              </View>
              <LoaderBlock width={80} />
            </View>
            <LoaderBlock width={120} height={20} />
          </View>
        </View>
      </View>

      {/* Payment Detail Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Payment Detail</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#E0F7FA' }]}>
              <LoaderBlock width={20} height={20} />
            </View>
            <View style={styles.paymentContent}>
              <LoaderBlock width={80} />
              <LoaderBlock width={120} height={20} />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentItem}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <LoaderBlock width={20} height={20} />
            </View>
            <View style={styles.paymentContent}>
              <LoaderBlock width={80} />
              <LoaderBlock width={120} height={20} />
            </View>
          </View>
        </View>
      </View>

      {/* Address Detail Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Address Detail</Text>
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <View style={styles.addressIconContainer}>
              <LoaderBlock width={24} height={24} />
            </View>
            <View style={styles.addressContent}>
              <LoaderBlock width={100} />
              <LoaderBlock width={150} height={20} />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.addressBody}>
            <LoaderBlock width="90%" height={15} />
            <LoaderBlock width="80%" height={15} />
            <LoaderBlock width="70%" height={15} />
          </View>
        </View>
      </View>

      {/* Tracking Detail Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Tracking Detail</Text>
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <LoaderBlock width={24} height={24} />
            <LoaderBlock width={120} />
          </View>
          <View style={styles.trackingTimeline}>
            {[1, 2, 3].map((_, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot}>
                  <LoaderBlock width={12} height={12} />
                </View>
                <View style={styles.timelineContent}>
                  <LoaderBlock width={150} />
                  <LoaderBlock width={100} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
  },
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGrey,
    marginBottom: 16,
  },
  orderDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  orderItemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    minWidth: '47%',
  },
  orderItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.mediumGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 4,
  },
  paymentContent: {
    flex: 1,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
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
  addressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  trackingTimeline: {
    paddingLeft: 8,
    gap: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
});

export default OrderDetailPlaceholder;
