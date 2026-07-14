import React, { memo, useCallback, useRef } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import OrderFilters, { OrderFilterValues } from "./OrderFilters";

type OrderFilterSheetProps = {
  visible: boolean;
  filters: OrderFilterValues;
  onChange: (filters: OrderFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  isApplying?: boolean;
};

const OrderFilterSheet = ({
  visible,
  filters,
  onChange,
  onApply,
  onClear,
  onClose,
  isApplying = false,
}: OrderFilterSheetProps) => {
  const insets = useSafeAreaInsets();
  const closingRef = useRef(false);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    onClose();
    // Allow rapid re-open after state flushes
    requestAnimationFrame(() => {
      closingRef.current = false;
    });
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close filters"
        style={styles.root}
        onPressIn={dismiss}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetAnchor}
          pointerEvents="box-none"
        >
          {/* Swallow presses so the backdrop dismiss does not fire */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <OrderFilters
                filters={filters}
                onChange={onChange}
                onApply={onApply}
                onClear={onClear}
                onClose={dismiss}
                isApplying={isApplying}
              />
            </ScrollView>

            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default memo(OrderFilterSheet);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 20, 0.45)",
  },
  sheetAnchor: {
    width: "100%",
    maxHeight: "88%",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D8E0DC",
  },
  scrollContent: {
    flexGrow: 1,
  },
});
