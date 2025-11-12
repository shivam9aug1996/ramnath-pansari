import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLazyListOrdersQuery } from "@/redux/features/adminOrderSlice";
import { AdminOrderDocument } from "@/types/global";
import { useRouter } from "expo-router";
import HeaderBar from "@/app/admin/components/HeaderBar";
import PaginationBar from "@/app/admin/components/PaginationBar";
import OrderListItem from "@/app/admin/components/OrderListItem";
import useDebounce from "@/hooks/useDebounce";

const AdminOrdersScreen = () => {
  const [trigger, { data, isFetching, isLoading, isSuccess, isError }] =
    useLazyListOrdersQuery();
  const listRef = React.useRef<FlatList<any>>(null);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    // Prefer cached data; only fetch when filters change or page explicitly changes.
    trigger(
      { page: 1, limit: 20, status, search: debouncedSearch || undefined },
      true
    );
    setPage(1);
  }, [trigger, status, debouncedSearch]);

  React.useEffect(() => {
    if (!isFetching) {
      setIsRefreshing(false);
    }
  }, [isFetching]);

//   const onRefresh = useCallback(() => {
//     // Reset filters and force a fresh fetch
//     setIsRefreshing(true);
//     setStatus(undefined);
//     setSearch("");
//     setPage(1);
//     listRef.current?.scrollToOffset({ offset: 0, animated: true });
//     // Force network (second arg false) and default params only
//     trigger({ page: 1, limit: 20 }, false);
//   }, [trigger]);


const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setStatus(undefined);
    setSearch("");
    setPage(1);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  
    try {
      await trigger({ page: 1, limit: 20 }, false).unwrap(); // wait for it to finish
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false); // always reset
    }
  }, [trigger]);

  const onNextPage = useCallback(() => {
    if (isFetching || isLoading) return;
    const current = data?.currentPage ?? page;
    const total = data?.totalPages ?? 1;
    const next = current + 1;
    if (next <= total) {
      setPage(next);
      trigger(
        { page: next, limit: 20, status, search: debouncedSearch || undefined },
        true
      );
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [
    isFetching,
    isLoading,
    data?.currentPage,
    data?.totalPages,
    trigger,
    status,
    debouncedSearch,
    page,
  ]);

  const onPrevPage = useCallback(() => {
    if (isFetching || isLoading) return;
    const current = data?.currentPage ?? page;
    const prev = Math.max(1, current - 1);
    if (prev !== current) {
      setPage(prev);
      trigger(
        { page: prev, limit: 20, status, search: debouncedSearch || undefined },
        true
      );
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [
    isFetching,
    isLoading,
    data?.currentPage,
    trigger,
    status,
    debouncedSearch,
    page,
  ]);

  const renderItem = ({ item }: { item: AdminOrderDocument }) => (
    <OrderListItem
      item={item}
      onPress={(id) => router.push(`/admin/orders/${id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {isFetching && !isRefreshing && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading order…</Text>
        </View>
      )}
      <HeaderBar title="Orders" />
      <View style={styles.filtersRow}>
        <TextInput
          placeholder="Search orderId / name / phone"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.statusPills}>
          {[
            "all",
            "confirmed",
            "out_for_delivery",
            "delivered",
            "canceled",
          ].map((s) => {
            const isActive = (s === "all" && !status) || s === status;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s === "all" ? undefined : s)}
                style={[styles.pill, isActive && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, isActive && styles.pillTextActive]}
                >
                  {s.replaceAll("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={data?.orders ?? []}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ flexGrow: 1,paddingBottom:24}}
       
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            progressViewOffset={0}
          />
        }
        ListFooterComponent={
          <PaginationBar
            currentPage={data?.currentPage ?? page}
            totalPages={data?.totalPages}
            loading={isFetching || isLoading}
            onPrev={onPrevPage}
            onNext={onNextPage}
          />
        }
        ListEmptyComponent={
          !isFetching && !isLoading ? (
            <View style={{ alignItems: "center", padding: 24 }}>
              <Text>No orders found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

export default AdminOrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  filtersRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: "#fff",
  },
  statusPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f0f0f0",
  },
  pillActive: {
    backgroundColor: "#222",
  },
  pillText: {
    fontSize: 12,
    color: "#222",
    textTransform: "capitalize",
  },
  pillTextActive: {
    color: "#fff",
  },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    marginBottom: 10,
  },
  orderId: {
    fontWeight: "600",
    fontSize: 14,
  },
  status: {
    textTransform: "capitalize",
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    textTransform: "capitalize",
    fontWeight: "700",
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backBtn: { paddingVertical: 6, paddingRight: 8, paddingLeft: 0 },
  backText: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
  paginationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  pageButtonDisabled: {
    backgroundColor: "#bbb",
  },
  pageButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  pageButtonTextDisabled: {
    color: "#eee",
  },
  pageIndicator: {
    fontSize: 12,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.09)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 8,
    color: "#111",
    fontWeight: "600",
  },
});
