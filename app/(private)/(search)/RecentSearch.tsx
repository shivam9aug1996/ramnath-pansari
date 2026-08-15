import React, { memo, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Category, RootState } from "@/types/global";
import { useCachedRecentSearch } from "@/hooks/useCachedRecentSearch";
import {
  categoryApi,
  setCategoryData,
} from "@/redux/features/categorySlice";
import { useDeleteRecentSearchMutation } from "@/redux/features/recentSearchSlice";
import {
  removeLocalRecentSearchItem,
  upsertRecentSearchInStore,
  writeRecentSearchCache,
  type RecentSearchItem,
} from "@/utils/recentSearchConfigCache";
import {
  getBrandChipsFromRecentlyViewed,
  getL2ChipsFromRecentlyViewed,
  type RecentlyViewedL2Chip,
} from "@/utils/categoryPath";
import CategorySelector from "@/app/(private)/(category)/CategoryList/CategorySelector";
import RecentlyViewedProducts from "@/app/(private)/(productDetail)/RecentlyViewedProducts";

const EMPTY_CATEGORIES: Category[] = [];

type RecentlyViewedStoreItem = {
  type?: string;
  categoryPath?: string[];
  brand?: string;
};

interface RecentSearchProps {
  onPress: (query: string) => void;
}

function formatRelativeTime(timestamp: string): string {
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

type RecentSearchRowProps = {
  item: RecentSearchItem;
  onPress: (query: string) => void;
  onDelete: (id: string) => void;
};

const RecentSearchRow = memo(function RecentSearchRow({
  item,
  onPress,
  onDelete,
}: RecentSearchRowProps) {
  const relativeTime = useMemo(
    () => formatRelativeTime(item.timestamp),
    [item.timestamp],
  );

  return (
    <View style={styles.item}>
      <Pressable
        onPress={() => onPress(item.query)}
        style={({ pressed }) => [
          styles.itemPressable,
          pressed && styles.itemPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Search for ${item.query}`}
      >
        <View style={styles.iconWell}>
          <Ionicons
            name="time-outline"
            size={16}
            color={Colors.light.mediumGreen}
          />
        </View>
        <View style={styles.itemTextWrap}>
          <Text style={styles.itemText} numberOfLines={1}>
            {item.query}
          </Text>
          {relativeTime ? (
            <Text style={styles.itemMeta} numberOfLines={1}>
              {relativeTime}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={() => onDelete(item._id)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.deleteButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.query} from recent searches`}
      >
        <Ionicons name="close" size={16} color={Colors.light.mediumGrey} />
      </Pressable>
    </View>
  );
});

const SearchContinueBrowsing = memo(function SearchContinueBrowsing() {
  const dispatch = useDispatch();
  const categories = useSelector(
    (state: RootState) =>
      categoryApi.endpoints.fetchCategories.select({})(state as never)?.data
        ?.categories ?? EMPTY_CATEGORIES,
  );
  const recentlyViewedItems = useSelector(
    (state: RootState) =>
      (state as { recentlyViewed?: { items?: RecentlyViewedStoreItem[] } })
        ?.recentlyViewed?.items,
  );

  const l2Chips = useMemo(
    () => getL2ChipsFromRecentlyViewed(categories, recentlyViewedItems),
    [categories, recentlyViewedItems],
  );

  const chipByL2Id = useMemo(() => {
    const map = new Map<string, RecentlyViewedL2Chip>();
    for (const chip of l2Chips) {
      map.set(chip.l2._id, chip);
    }
    return map;
  }, [l2Chips]);

  const l2Categories = useMemo(
    () => l2Chips.map((chip) => chip.l2),
    [l2Chips],
  );

  const handleSelectL2 = useCallback(
    (item: Category) => {
      const chip = chipByL2Id.get(item._id);
      if (!chip) return;
      Keyboard.dismiss();
      dispatch(setCategoryData(chip.l1));
      router.push(
        `/(category)/${chip.l1._id?.toString()}?name=${encodeURIComponent(
          chip.l1.name ?? "",
        )}&selectedCategoryIdIndex=${chip.selectedCategoryIdIndex}`,
      );
    },
    [chipByL2Id, dispatch],
  );

  if (!l2Categories.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Continue browsing</Text>
      <CategorySelector
        categories={l2Categories}
        onSelectCategory={handleSelectL2}
        variant="large"
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );
});

const SearchRecentBrands = memo(function SearchRecentBrands() {
  const recentlyViewedItems = useSelector(
    (state: RootState) =>
      (state as { recentlyViewed?: { items?: RecentlyViewedStoreItem[] } })
        ?.recentlyViewed?.items,
  );

  const brands = useMemo(
    () => getBrandChipsFromRecentlyViewed(recentlyViewedItems),
    [recentlyViewedItems],
  );

  const handleBrandPress = useCallback((brand: string) => {
    Keyboard.dismiss();
    router.push(
      `/(result)/${encodeURIComponent(brand)}?brands=${encodeURIComponent(brand)}&brandBrowse=1` as never,
    );
  }, []);

  if (!brands.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Brands</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.brandList}
        keyboardShouldPersistTaps="always"
      >
        {brands.map((brand) => (
          <Pressable
            key={brand.toLowerCase()}
            onPress={() => handleBrandPress(brand)}
            style={({ pressed }) => [
              styles.brandChip,
              pressed && styles.brandChipPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Browse ${brand} products`}
          >
            <Text style={styles.brandChipText} numberOfLines={1}>
              {brand}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

const RecentSearchFooter = memo(function RecentSearchFooter() {
  return (
    <View style={styles.footer}>
      <RecentlyViewedProducts variant="mini" />
      <SearchRecentBrands />
      <SearchContinueBrowsing />
    </View>
  );
});

const RecentSearch: React.FC<RecentSearchProps> = ({ onPress }) => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const isGuestUser = useSelector(
    (state: RootState) => state.auth.userData?.isGuestUser,
  );
  const data = useCachedRecentSearch(userId, "RecentSearch");
  const [deleteRecentSearch] = useDeleteRecentSearchMutation();

  const sortedData = useMemo(
    () =>
      data
        ? [...data].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
        : [],
    [data],
  );

  const handlePress = useCallback(
    (query: string) => {
      if (query) onPress(query);
    },
    [onPress],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!userId) return;
      if (isGuestUser) {
        await removeLocalRecentSearchItem(dispatch, userId, id);
        return;
      }
      await deleteRecentSearch({ userId, id })?.unwrap();
      const next = data.filter((item) => item._id !== id);
      await upsertRecentSearchInStore(dispatch, userId, next);
      await writeRecentSearchCache(userId, next);
    },
    [deleteRecentSearch, userId, isGuestUser, data, dispatch],
  );

  const renderItem = useCallback(
    ({ item }: { item: RecentSearchItem }) => (
      <RecentSearchRow
        item={item}
        onPress={handlePress}
        onDelete={handleDelete}
      />
    ),
    [handlePress, handleDelete],
  );

  const renderListHeader = useCallback(() => {
    if (!sortedData.length) return null;
    return (
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent Searches</Text>
      </View>
    );
  }, [sortedData.length]);

  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconWell}>
          <Ionicons
            name="search-outline"
            size={22}
            color={Colors.light.mediumLightGrey}
          />
        </View>
        <Text style={styles.emptyTitle}>No recent searches</Text>
        <Text style={styles.emptyText}>
          Your last searches will show up here.
        </Text>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        bounces={Platform.OS === "android" ? false : true}
        data={sortedData}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={RecentSearchFooter}
        keyboardShouldPersistTaps="always"
        onScrollBeginDrag={Keyboard.dismiss}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default memo(RecentSearch);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  countLabel: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    overflow: "hidden",
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 22,
    fontSize: 11,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGreen,
    backgroundColor: Colors.light.softGrey_1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.softGrey_1,
    marginBottom: 10,
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 8,
  },
  itemPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingVertical: 4,
  },
  itemPressed: {
    opacity: 0.7,
  },
  iconWell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.white,
  },
  itemTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemText: {
    fontSize: 14,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.darkGrey,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumLightGrey,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonPressed: {
    backgroundColor: Colors.light.white,
  },
  empty: {
    paddingTop: 36,
    paddingBottom: 12,
    alignItems: "center",
  },
  emptyIconWell: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.softGrey_1,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.mediumGrey,
    textAlign: "center",
  },
  footer: {
    marginTop: 8,
  },
  section: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 10,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  categoryList: {
    paddingRight: 8,
  },
  brandList: {
    paddingRight: 8,
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.light.softGrey_1,
  },
  brandChipPressed: {
    opacity: 0.7,
  },
  brandChipText: {
    fontSize: 13,
    fontFamily: "Montserrat_500Medium",
    color: Colors.light.darkGreen,
    textTransform: "capitalize",
  },
});
