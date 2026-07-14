import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { useFetchOrdersQuery } from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { useSelector } from "react-redux";
import NotFound from "../(result)/NotFound";
import OrderListPlaceHolder from "./OrderListPlaceHolder";
import OrderItem from "./OrderItem";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import TryAgain from "../(category)/CategoryList/TryAgain";
import { devLog } from "@/utils/devLog";
import { OrderFilterValues } from "./OrderFilters";
import OrderPaginationBar from "./OrderPaginationBar";
import OrderFilterBar from "./OrderFilterBar";
import OrderFilterSheet from "./OrderFilterSheet";

const EMPTY_FILTERS: OrderFilterValues = {
  orderId: "",
};

const Order = () => {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] =
    useState<OrderFilterValues>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<OrderFilterValues>(EMPTY_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList>(null);

  const queryArgs = useMemo(() => {
    const args = {
      userId: userId as string,
      limit: 10,
      page,
    } as {
      userId: string;
      limit: number;
      page: number;
      orderId?: string;
    };

    const trimmedOrderId = appliedFilters.orderId.trim();
    if (trimmedOrderId) {
      args.orderId = trimmedOrderId;
    }

    return args;
  }, [appliedFilters, page, userId]);

  const {
    data: orderData,
    isLoading: isOrderLoading,
    isFetching: isOrderFetching,
    isError: isOrderError,
    refetch: refetchOrder,
  } = useFetchOrdersQuery(queryArgs, {
    skip: !userId,
    // Cache each page separately; only fetch when that page isn't cached yet.
    refetchOnMountOrArgChange: false,
    refetchOnReconnect: true,
  });

  const orders = orderData?.orders ?? [];
  const totalPages = Math.max(orderData?.totalPages ?? 1, 1);
  const currentPage = orderData?.currentPage ?? page;
  const hasOrdersToShow = orders.length > 0;
  const hasActiveFilters = Boolean(appliedFilters.orderId.trim());

  const isInitialLoad =
    isOrderLoading || (isOrderFetching && !hasOrdersToShow && !isRefreshing);
  const showTryAgain =
    isOrderError && !hasOrdersToShow && !isOrderFetching;
  const showEmpty =
    !isInitialLoad && !isOrderFetching && !hasOrdersToShow;

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const goToPreviousPage = useCallback(() => {
    if (page <= 1 || isOrderFetching) return;
    setPage((prev) => prev - 1);
    scrollToTop();
  }, [isOrderFetching, page, scrollToTop]);

  const goToNextPage = useCallback(() => {
    if (page >= totalPages || isOrderFetching) return;
    setPage((prev) => prev + 1);
    scrollToTop();
  }, [isOrderFetching, page, totalPages, scrollToTop]);

  const onRefresh = useCallback(() => {
    if (!userId) return;

    setIsRefreshing(true);
    if (page !== 1) {
      setPage(1);
      return;
    }

    refetchOrder();
  }, [page, refetchOrder, userId]);

  const handleRetryOrders = useCallback(() => {
    setPage(1);
    refetchOrder();
  }, [refetchOrder]);

  const openFilterSheet = useCallback(() => {
    devLog("[Order] openFilterSheet");
    setDraftFilters(appliedFilters);
    setIsFilterSheetOpen(true);
  }, [appliedFilters]);

  const closeFilterSheet = useCallback(() => {
    devLog("[Order] closeFilterSheet called");
    setIsFilterSheetOpen(false);
  }, []);

  useEffect(() => {
    devLog("[Order] isFilterSheetOpen:", isFilterSheetOpen);
  }, [isFilterSheetOpen]);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      orderId: draftFilters.orderId.trim(),
    });
    setPage(1);
    scrollToTop();
    setIsFilterSheetOpen(false);
  }, [draftFilters, scrollToTop]);

  const handleClearFilters = useCallback(() => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
    scrollToTop();
    setIsFilterSheetOpen(false);
  }, [scrollToTop]);

  useEffect(() => {
    if (!isRefreshing || isOrderFetching) return;
    setIsRefreshing(false);
  }, [isRefreshing, isOrderFetching]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      return <OrderItem key={item?._id || index} item={item} index={index} />;
    },
    [],
  );

  const listHeader = useMemo(
    () => (
      <OrderFilterBar
        appliedFilters={appliedFilters}
        onOpenFilters={openFilterSheet}
        onClearFilters={handleClearFilters}
      />
    ),
    [appliedFilters, handleClearFilters, openFilterSheet],
  );

  return (
    <>
      <ScreenSafeWrapper title="My Orders">
      <DeferredFadeIn delay={0} style={{ flex: 1 }}>
        <View style={{ height: 10 }} />
        <View style={styles.content}>
          {isInitialLoad ? (
            <View>
              <OrderListPlaceHolder />
            </View>
          ) : showTryAgain ? (
            <TryAgain
              refetch={handleRetryOrders}
              title="Couldn't load orders"
              message="Please check your connection and try again."
            />
          ) : (
            <>
              <FlatList
                ref={listRef}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                  />
                }
                initialNumToRender={5}
                bounces={Platform.OS === "android" ? false : true}
                ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
                showsVerticalScrollIndicator={false}
                data={orders}
                renderItem={renderProductItem}
                keyExtractor={(item, index) =>
                  item?._id ? String(item._id) : index.toString()
                }
                ListHeaderComponent={listHeader}
                contentContainerStyle={styles.flatList}
                ListEmptyComponent={
                  showEmpty ? (
                    <NotFound
                      title={
                        hasActiveFilters ? "No matching orders" : "Order not Found"
                      }
                      subtitle={
                        hasActiveFilters
                          ? "Try a different order ID."
                          : "You haven't placed any order yet."
                      }
                    />
                  ) : null
                }
              />

              <OrderPaginationBar
                page={currentPage}
                totalPages={totalPages}
                isFetching={isOrderFetching && !isRefreshing}
                onPrevious={goToPreviousPage}
                onNext={goToNextPage}
              />
            </>
          )}
        </View>
      </DeferredFadeIn>
      </ScreenSafeWrapper>

      <OrderFilterSheet
        visible={isFilterSheetOpen}
        filters={draftFilters}
        onChange={setDraftFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        onClose={closeFilterSheet}
        isApplying={isOrderFetching && page === 1}
      />
    </>
  );
};

export default Order;

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  flatList: {
    paddingTop: 10,
    paddingBottom: 8,
    flexGrow: 1,
  },
});
