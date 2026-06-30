import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
  useDeleteAdminCarouselMutation,
  useBackfillCarouselBlurhashMutation,
  useListAdminCarouselQuery,
  useUpdateAdminCarouselMutation,
} from "@/redux/features/adminCarouselSlice";
import { AdminCarouselDocument } from "@/types/global";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";

function getActionLabel(banner: AdminCarouselDocument) {
  if (banner.actionType === "scroll_categories") {
    return "Scroll to categories";
  }
  if (banner.actionType === "category") {
    return banner.categoryName
      ? `Open ${banner.categoryName}`
      : "Open category";
  }
  return "No action";
}

const AdminCarouselScreen = () => {
  const router = useRouter();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const { data, isFetching, isLoading, refetch } = useListAdminCarouselQuery();
  const [updateBanner] = useUpdateAdminCarouselMutation();
  const [deleteBanner] = useDeleteAdminCarouselMutation();
  const [backfillBlurhash, { isLoading: isBackfilling }] =
    useBackfillCarouselBlurhashMutation();

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false);
  }, [pullRefreshing, isFetching]);

  const onRefresh = useCallback(() => {
    setPullRefreshing(true);
    refetch();
  }, [refetch]);

  const banners = data?.banners ?? [];

  const toggleEnabled = async (banner: AdminCarouselDocument) => {
    await updateBanner({
      id: banner.id,
      body: { enabled: !banner.enabled },
    });
  };

  const confirmBackfillBlurhash = () => {
    Alert.alert(
      "Generate blur placeholders",
      "Create blurhash placeholders for banners that do not have one yet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Run",
          onPress: async () => {
            try {
              const result = await backfillBlurhash().unwrap();
              Alert.alert(
                "Done",
                `Updated ${result.updated} of ${result.total} banners.`,
              );
            } catch (error: any) {
              Alert.alert(
                "Failed",
                error?.data?.error?.message ?? "Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const confirmDelete = (banner: AdminCarouselDocument) => {
    Alert.alert(
      "Delete banner",
      "Remove this carousel banner? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBanner(banner.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminCarouselDocument }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardBody}
        onPress={() => router.push(`/admin/carousel/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.imageUrl || staticImage }}
            style={styles.thumb}
          />
          <View style={styles.cardMeta}>
            <Text style={styles.actionLabel}>{getActionLabel(item)}</Text>
            <Text style={styles.meta}>Sort order: {item.sortOrder}</Text>
          </View>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleEnabled(item)}
            trackColor={{ true: adminTheme.accent, false: "#ccc" }}
          />
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => confirmDelete(item)}
        hitSlop={8}
        accessibilityLabel="Delete banner"
      >
        <Ionicons name="trash-outline" size={20} color="#D32F2F" />
      </TouchableOpacity>
    </View>
  );

  return (
    <AdminScreen>
      <HeaderBar
        title="Home carousel"
        subtitle="Banner slides on home"
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={confirmBackfillBlurhash}
              disabled={isBackfilling}
              hitSlop={8}
              style={styles.headerBtn}
            >
              <Ionicons
                name="color-wand-outline"
                size={22}
                color={adminTheme.accent}
              />
            </TouchableOpacity>
            <AdminAddButton
              onPress={() => router.push("/admin/carousel/create" as any)}
              accessibilityLabel="Add banner"
            />
          </View>
        }
      />
      <FlatList
        data={banners}
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
              icon="images-outline"
              iconColor="#0F766E"
              iconBg="#CCFBF1"
              title="No banners yet"
              subtitle="Add slides for the home carousel"
              actionLabel="Add banner"
              onAction={() => router.push("/admin/carousel/create" as any)}
            />
          )
        }
      />
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBtn: {
    padding: 4,
  },
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 72,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  cardMeta: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
    color: adminTheme.textPrimary,
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: adminTheme.textSecondary,
    fontFamily: "Montserrat_500Medium",
  },
  deleteBtn: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: adminTheme.border,
    backgroundColor: "#FEF2F2",
  },
});

export default AdminCarouselScreen;
