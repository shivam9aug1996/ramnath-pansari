import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { convertDate, getOrderStatusTitle1 } from "../(order)/utils";

const getStatusStyle = (status: string) => {
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'confirmed':
      return {
        backgroundColor: '#E0F7FA',
        iconColor: '#00ACC1',
        textColor: '#00838F',
        icon: 'checkbox-marked-circle-outline'
      };
    case 'out_for_delivery':
      return {
        backgroundColor: '#FFF7CD',
        iconColor: '#FFB300',
        textColor: '#F57F17',
        icon: 'truck-delivery'
      };
    case 'delivered':
      return {
        backgroundColor: '#EBF4F1',
        iconColor: '#2E7D32',
        textColor: '#1B5E20',
        icon: 'package-variant-closed'
      };
    case 'canceled':
      return {
        backgroundColor: '#F8ECEC',
        iconColor: '#D32F2F',
        textColor: '#B71C1C',
        icon: 'close-circle'
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        iconColor: '#757575',
        textColor: '#616161',
        icon: 'information'
      };
  }
};

const StepItem = ({
  timestamp,
  status,
  index,
  isLast
}: {
  timestamp: string;
  status: string;
  index: number;
  isLast: boolean;
}) => {
  const statusStyle = getStatusStyle(status);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.timelineLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: statusStyle.backgroundColor }
        ]}>
          <MaterialCommunityIcons
            name={statusStyle.icon}
            size={16}
            color={statusStyle.iconColor}
          />
        </View>
        {!isLast && <View style={[
          styles.timelineLine,
          { backgroundColor: statusStyle.backgroundColor }
        ]} />}
      </View>

      <View style={styles.stepContent}>
        <Text style={[
          styles.stepStatus,
          { color: statusStyle.textColor }
        ]}>
          {getOrderStatusTitle1(status)}
        </Text>
        <Text style={styles.stepDate}>
          {convertDate(timestamp)}
        </Text>
      </View>
    </View>
  );
};

const StepOrderTracking = ({ trackingData }) => {
  if (!trackingData?.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="timeline-clock"
          size={24}
          color="#00ACC1"
        />
        <Text style={styles.heading}>Order Timeline</Text>
      </View>

      <View style={styles.timelineContainer}>
        {trackingData.map((item, index) => (
          <StepItem
            key={item?.timestamp + index}
            timestamp={item?.timestamp}
            status={item?.status}
            index={index}
            isLast={index === trackingData.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  heading: {
    fontFamily: "Raleway_700Bold",
    fontSize: 20,
    color: Colors.light.darkGrey,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 40,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 32,
    bottom: -24,
    left: 15,
    opacity: 0.3,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingTop: 4,
  },
  stepStatus: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 15,
    marginBottom: 4,
  },
  stepDate: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    letterSpacing: 0.3,
  },
});

export default memo(StepOrderTracking);
