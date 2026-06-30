import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AdminScreen from "@/app/admin/components/AdminScreen";
import HeaderBar from "@/app/admin/components/HeaderBar";
import AdminListFilters from "@/app/admin/components/AdminListFilters";
import AdminEmptyState from "@/app/admin/components/AdminEmptyState";
import { adminListStyles, adminTheme } from "@/app/admin/theme";
import { useRouter } from "expo-router";
import { useListAdminProductsQuery } from "@/redux/features/adminProductSlice";
import { AdminProductDocument } from "@/types/global";
import useDebounce from "@/hooks/useDebounce";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import { setPendingProductSelection } from "./productSelection";

const SelectPromoProductScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const { data, isFetching, isLoading, refetch } = useListAdminProductsQuery({
    page: 1,
    limit: 50,
    search: debouncedSearch || undefined,
    promoOnly: "true",
  });

  React.useEffect(() => {
    if (pullRefreshing && !isFetching) setPullRefreshing(false);
  }, [pullRefreshing, isFetching]);

  const onRefresh = useCallback(() => {
    setPullRefreshing(true);
    refetch();
  }, [refetch]);

  const products = data?.products ?? [];

  const onSelect = (item: AdminProductDocument) => {
    setPendingProductSelection({
      id: item._id,
      name: item.name,
      size: item.size,
      image: item.image,
    });
    router.back();
  };

  const renderItem = ({ item }: { item: AdminProductDocument }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onSelect(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image || staticImage }}
        style={styles.thumb}
      />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.meta}>{item.size}</Text>
        <Text style={styles.price}>
          MRP ₹{item.price}
          {item.discountedPrice !== item.price
            ? ` · Sell ₹${item.discountedPrice}`
            : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <AdminScreen>
      <HeaderBar
        title="Choose promo product"
        subtitle="Freebie / offer products only"
      />
      <AdminListFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search promo products…"
        filters={[]}
        activeFilterKey={undefined}
        onFilterChange={() => {}}
        summaryText={`${data?.totalCount ?? 0} promo products`}
        loading={isFetching && !pullRefreshing}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
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
              title="No promo products"
              subtitle="Create a product with Promo / freebie only enabled"
            />
          )
        }
      />
    </AdminScreen>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: adminTheme.cardBg,
    borderWidth: 1,
    borderColor: adminTheme.border,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  body: { flex: 1 },
  name: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 14,
    color: adminTheme.textPrimary,
  },
  meta: {
    marginTop: 2,
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: adminTheme.textSecondary,
  },
  price: {
    marginTop: 4,
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 12,
    color: adminTheme.textPrimary,
  },
});

export default SelectPromoProductScreen;
