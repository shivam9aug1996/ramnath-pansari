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

/** Matches `#root` max-width in `app/+html.tsx`. RN Modal portals outside `#root`. */
const WEB_SHELL_MAX_WIDTH = 430;

type ProductSheetShellProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** When false, children manage their own scroll (e.g. FlatList). */
  scrollable?: boolean;
};

const ProductSheetShell = ({
  visible,
  onClose,
  children,
  footer,
  scrollable = true,
}: ProductSheetShellProps) => {
  const insets = useSafeAreaInsets();
  const closingRef = useRef(false);

  const dismiss = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    onClose();
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
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetAnchor}
          pointerEvents="box-none"
        >
          <View style={styles.sheet}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
            {scrollable ? (
              <ScrollView
                style={styles.scroll}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                contentContainerStyle={styles.scrollContent}
              >
                {children}
              </ScrollView>
            ) : (
              <View style={styles.scroll}>{children}</View>
            )}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default memo(ProductSheetShell);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: Platform.OS === "web" ? "center" : undefined,
    backgroundColor: "rgba(15, 23, 20, 0.45)",
  },
  sheetAnchor: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? WEB_SHELL_MAX_WIDTH : undefined,
    maxHeight: "88%",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "100%",
    overflow: "hidden",
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
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6EBE8",
    backgroundColor: "#FFFFFF",
  },
});
