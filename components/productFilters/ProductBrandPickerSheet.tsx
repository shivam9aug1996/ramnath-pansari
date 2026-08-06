import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import Button from "@/components/Button";
import ProductSheetShell from "./ProductSheetShell";

const LIST_MAX_HEIGHT = Math.min(Dimensions.get("window").height * 0.52, 420);

type BrandSection = {
  title: string;
  data: string[];
};

type ProductBrandPickerSheetProps = {
  visible: boolean;
  brands: string[];
  selected: string[];
  onChange: (brands: string[]) => void;
  onClose: () => void;
};

function brandSectionKey(brand: string): string {
  const ch = brand.trim().charAt(0).toUpperCase();
  return ch >= "A" && ch <= "Z" ? ch : "#";
}

const ProductBrandPickerSheet = ({
  visible,
  brands,
  selected,
  onChange,
  onClose,
}: ProductBrandPickerSheetProps) => {
  const [query, setQuery] = useState("");
  const [draftSelected, setDraftSelected] = useState<string[]>(selected);

  useEffect(() => {
    if (visible) {
      setDraftSelected(selected);
      setQuery("");
    }
  }, [visible, selected]);

  const selectedSet = useMemo(
    () => new Set(draftSelected.map((b) => b.toLowerCase())),
    [draftSelected],
  );

  const sections = useMemo((): BrandSection[] => {
    const q = query.trim().toLowerCase();
    const list = (
      q ? brands.filter((b) => b.toLowerCase().includes(q)) : brands
    )
      .slice()
      .sort((a, b) => a.localeCompare(b));

    const map = new Map<string, string[]>();
    for (const brand of list) {
      const key = brandSectionKey(brand);
      const bucket = map.get(key);
      if (bucket) bucket.push(brand);
      else map.set(key, [brand]);
    }

    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === "#") return 1;
        if (b === "#") return -1;
        return a.localeCompare(b);
      })
      .map(([title, data]) => ({ title, data }));
  }, [brands, query]);

  const toggleBrand = useCallback((brand: string) => {
    const lower = brand.toLowerCase();
    setDraftSelected((prev) => {
      const exists = prev.some((b) => b.toLowerCase() === lower);
      if (exists) return prev.filter((b) => b.toLowerCase() !== lower);
      return [...prev, brand];
    });
  }, []);

  const handleDone = () => {
    onChange(draftSelected);
    onClose();
  };

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      const isOn = selectedSet.has(item.toLowerCase());
      return (
        <Pressable style={styles.row} onPress={() => toggleBrand(item)}>
          <Text style={[styles.rowLabel, isOn && styles.rowLabelOn]}>
            {item}
          </Text>
          <View style={[styles.checkbox, isOn && styles.checkboxOn]}>
            {isOn ? (
              <Ionicons name="checkmark" size={14} color="#fff" />
            ) : null}
          </View>
        </Pressable>
      );
    },
    [selectedSet, toggleBrand],
  );

  return (
    <ProductSheetShell
      visible={visible}
      onClose={onClose}
      scrollable={false}
      footer={
        <View style={styles.actions}>
          <Button
            title={
              draftSelected.length > 0
                ? `Done (${draftSelected.length})`
                : "Done"
            }
            onPress={handleDone}
            wrapperStyle={styles.doneButton}
          />
          {draftSelected.length > 0 ? (
            <Pressable
              style={styles.clearButton}
              onPress={() => setDraftSelected([])}
            >
              <Text style={styles.clearText}>Clear brands</Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Brands</Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.light.darkGrey} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={Colors.light.mediumGrey} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search A–Z"
            placeholderTextColor={Colors.light.mediumGrey}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {sections.length === 0 ? (
          <Text style={styles.emptyHint}>No brands match</Text>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            stickySectionHeadersEnabled
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            initialNumToRender={24}
            windowSize={8}
          />
        )}
      </View>
    </ProductSheetShell>
  );
};

export default memo(ProductBrandPickerSheet);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 22,
    color: Colors.light.darkGrey,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F5F4",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E6EBE8",
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontFamily: "Montserrat_500Medium",
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
  list: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  sectionHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionHeaderText: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
    color: Colors.light.darkGreen,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6EBE8",
  },
  rowLabel: {
    flex: 1,
    paddingRight: 12,
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
    color: Colors.light.darkGrey,
  },
  rowLabelOn: {
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.darkGreen,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#C9D4CE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: {
    backgroundColor: Colors.light.lightGreen,
    borderColor: Colors.light.lightGreen,
  },
  emptyHint: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    paddingVertical: 16,
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 4,
  },
  doneButton: {
    marginTop: 0,
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  clearText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGrey,
  },
});
