import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import AdminAddButton from "@/app/admin/components/AdminAddButton";
import AdminEmptyState from "@/app/admin/components/AdminEmptyState";
import { adminListStyles, adminTheme } from "@/app/admin/theme";
import { useRouter } from "expo-router";
import {
  useDeleteAdminOfferMutation,
  useListAdminOffersQuery,
  useUpdateAdminOfferMutation,
} from "@/redux/features/adminOfferSlice";
import { AdminOfferDocument } from "@/types/global";
import { getOfferLabel } from "@/utils/offerMilestones";

const AdminOffersScreen = () => {
  const router = useRouter();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { data, isFetching, isLoading, refetch } = useListAdminOffersQuery();
  const [updateOffer] = useUpdateAdminOfferMutation();
  const [deleteOffer] = useDeleteAdminOfferMutation();

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false);
  }, [pullRefreshing, isFetching]);

  const onRefresh = useCallback(() => {
    setPullRefreshing(true);
    refetch();
  }, [refetch]);

  const offers = data?.offers ?? [];

  const toggleEnabled = async (offer: AdminOfferDocument) => {
    await updateOffer({
      id: offer.id,
      body: { enabled: !offer.enabled },
    });
  };

  const confirmDelete = (offer: AdminOfferDocument) => {
    Alert.alert(
      "Delete offer",
      `Remove "${getOfferLabel(offer)}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteOffer(offer.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminOfferDocument }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => router.push(`/admin/offers/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.typeBadge,
                item.type === "freebie" ? styles.freebieBadge : styles.discountBadge,
              ]}
            >
              <Text style={styles.typeBadgeText}>{item.type}</Text>
            </View>
            <Text style={styles.threshold}>₹{item.minOrderValue}+</Text>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleEnabled(item)}
            trackColor={{ true: adminTheme.accent, false: "#ccc" }}
          />
        </View>
        <Text style={styles.label}>{getOfferLabel(item)}</Text>
        <Text style={styles.meta}>Sort order: {item.sortOrder}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => confirmDelete(item)}
        hitSlop={8}
        accessibilityLabel="Delete offer"
      >
        <Ionicons name="trash-outline" size={20} color="#D32F2F" />
      </TouchableOpacity>
    </View>
  );

  return (
    <AdminScreen>
      <HeaderBar
        title="Offers"
        subtitle="Promotions & milestones"
        right={
          <AdminAddButton
            onPress={() => router.push("/admin/offers/create" as any)}
            accessibilityLabel="Add offer"
          />
        }
      />
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={adminListStyles.listContent}
        refreshControl={
          <RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          isLoading || isFetching ? (
            <ActivityIndicator style={{ marginTop: 40 }} />
          ) : (
            <AdminEmptyState
              icon="gift-outline"
              iconColor="#BE185D"
              iconBg="#FCE7F3"
              title="No offers yet"
              subtitle="Create your first promotion"
              actionLabel="Create offer"
              onAction={() => router.push("/admin/offers/create" as any)}
            />
          )
        }
      />
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: adminTheme.cardBg,
    borderRadius: 14,
    marginBottom: 10,
    marginHorizontal: adminTheme.listHorizontalPad,
    borderWidth: 1,
    borderColor: adminTheme.border,
    overflow: "hidden",
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  deleteBtn: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: adminTheme.border,
    backgroundColor: "#FEF2F2",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freebieBadge: {
    backgroundColor: "#E8F5E9",
  },
  discountBadge: {
    backgroundColor: "#E3F2FD",
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
    textTransform: "capitalize",
    color: adminTheme.textPrimary,
  },
  threshold: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
    color: adminTheme.textSecondary,
  },
  label: {
    fontSize: 15,
    fontFamily: "Raleway_600SemiBold",
    color: adminTheme.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: adminTheme.textSecondary,
    fontFamily: "Montserrat_500Medium",
  },
});

export default AdminOffersScreen;
