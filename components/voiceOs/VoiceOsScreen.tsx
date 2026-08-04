import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AppHead from "@/components/AppHead";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
import { useVoiceOs } from "@/voiceOs";
import type { ChatMessage, ConversationContext, SessionProduct } from "@/voiceOs";
import { DEFAULT_MAX_CART_QTY } from "@/voiceOs/types";
import { performUiHandoff } from "@/voiceOs/uiHandoff";

/** Render digits with Montserrat; rest keeps bubble font. */
function MixedFontText({
  text,
  style,
  numberStyle,
}: {
  text: string;
  style?: object;
  numberStyle?: object;
}) {
  const parts = text.split(/(\d[\d,]*(?:\.\d+)?)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        /^\d[\d,]*(?:\.\d+)?$/.test(part) ? (
          <Text key={i} style={numberStyle}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

function formatPrice(p: SessionProduct): string | null {
  const price = p.discountedPrice ?? p.price;
  if (price == null || Number.isNaN(Number(price))) return null;
  return `₹${price}`;
}

function maxQtyFor(product: SessionProduct | null | undefined): number {
  const m = product?.maxQuantity;
  if (typeof m === "number" && m > 0) return Math.min(m, DEFAULT_MAX_CART_QTY);
  return DEFAULT_MAX_CART_QTY;
}

function ProductChips({
  products,
  onSelect,
  enabled,
}: {
  products: SessionProduct[];
  onSelect: (index: number) => void;
  enabled: boolean;
}) {
  return (
    <View style={styles.chips}>
      {products.slice(0, 8).map((p, index) => {
        const price = formatPrice(p);
        return (
          <Pressable
            key={p._id}
            disabled={!enabled}
            onPress={() => onSelect(index)}
            style={({ pressed }) => [
              styles.chip,
              !enabled && styles.chipDisabled,
              pressed && enabled && styles.chipPressed,
            ]}
          >
            <View style={styles.chipIndexWrap}>
              <Text style={styles.chipIndex}>{index + 1}</Text>
            </View>
            <Image
              source={{ uri: p.image || staticImage }}
              placeholder={staticImage}
              contentFit="contain"
              style={styles.chipImage}
              transition={150}
            />
            <View style={styles.chipBody}>
              <Text style={styles.chipName} numberOfLines={2}>
                {p.name}
              </Text>
              <View style={styles.chipMeta}>
                {p.size ? (
                  <Text style={styles.chipSize} numberOfLines={1}>
                    {p.size}
                  </Text>
                ) : null}
                {price ? <Text style={styles.chipPrice}>{price}</Text> : null}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

type QuickAction =
  | { id: string; label: string; value: string; kind: "yes" | "no" | "qty" };

function buildQuickActions(context: ConversationContext | undefined): {
  title: string;
  actions: QuickAction[];
} | null {
  if (!context) return null;

  if (context.pendingConfirmation || context.pendingMultiProductConfirm) {
    return {
      title: "Confirm",
      actions: [
        { id: "yes", label: "Haan", value: "haan", kind: "yes" },
        { id: "no", label: "Nahi", value: "nahi", kind: "no" },
      ],
    };
  }

  if (context.pendingQuantity && context.selectedProduct) {
    const maxQ = maxQtyFor(context.selectedProduct);
    return {
      title: `Quantity (1–${maxQ})`,
      actions: Array.from({ length: maxQ }, (_, i) => {
        const n = i + 1;
        return {
          id: `qty-${n}`,
          label: String(n),
          value: String(n),
          kind: "qty" as const,
        };
      }),
    };
  }

  return null;
}

function QuickActionBar({
  title,
  actions,
  disabled,
  onPress,
}: {
  title: string;
  actions: QuickAction[];
  disabled: boolean;
  onPress: (value: string) => void;
}) {
  return (
    <View style={styles.quickBar}>
      <Text style={styles.quickTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
      >
        {actions.map((action) => (
          <Pressable
            key={action.id}
            disabled={disabled}
            onPress={() => onPress(action.value)}
            style={({ pressed }) => [
              styles.quickChip,
              action.kind === "yes" && styles.quickChipYes,
              action.kind === "no" && styles.quickChipNo,
              action.kind === "qty" && styles.quickChipQty,
              disabled && styles.quickChipDisabled,
              pressed && !disabled && styles.chipPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Text
              style={[
                styles.quickChipText,
                action.kind === "yes" && styles.quickChipTextYes,
                action.kind === "no" && styles.quickChipTextNo,
                action.kind === "qty" && styles.quickChipTextQty,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function MessageBubble({
  message,
  onPickProduct,
  productPickEnabled,
}: {
  message: ChatMessage;
  onPickProduct: (index: number) => void;
  productPickEnabled: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <MixedFontText
          text={message.content}
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
          ]}
          numberStyle={[
            styles.bubbleNumber,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
          ]}
        />
        {!isUser && message.products && message.products.length > 0 ? (
          <ProductChips
            products={message.products}
            onSelect={onPickProduct}
            enabled={productPickEnabled}
          />
        ) : null}
        {!isUser && message.uiAction?.action === "OPEN_SEARCH_RESULTS" ? (
          <Pressable
            onPress={() => performUiHandoff(message.uiAction!)}
            style={styles.moreBtn}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={Colors.light.darkGreen}
            />
            <Text style={styles.moreBtnText}>Aur results dekho</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.light.darkGreen}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function VoiceOsScreen() {
  const { messages, isProcessing, sendMessage, reset, context } = useVoiceOs();
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const quick = useMemo(() => buildQuickActions(context), [context]);
  const productPickEnabled = Boolean(
    context?.pendingProductSelection &&
      !context?.pendingConfirmation &&
      !context?.pendingQuantity &&
      !context?.pendingMultiProductConfirm &&
      !isProcessing,
  );

  useEffect(() => {
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages.length, isProcessing, quick?.title]);

  const onSend = useCallback(() => {
    const value = input.trim();
    if (!value) return;
    setInput("");
    void sendMessage(value);
  }, [input, sendMessage]);

  const onQuick = useCallback(
    (value: string) => {
      void sendMessage(value);
    },
    [sendMessage],
  );

  const onPickProduct = useCallback(
    (index: number) => {
      void sendMessage(String(index + 1));
    },
    [sendMessage],
  );

  return (
    <>
      <AppHead title="Shop Assist" />
      <ScreenSafeWrapper
        title="Shop Assist"
        useKeyboardAvoidingView={false}
        showCartIcon
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <View style={styles.metaRow}>
            <MixedFontText
              text={`${context?.business ?? "Ramnath Pansari"}${
                context?.customerName ? ` · ${context.customerName}` : ""
              }${
                context?.cartItemCount
                  ? ` · Cart ${context.cartItemCount}`
                  : ""
              }`}
              style={styles.metaText}
              numberStyle={styles.metaNumber}
            />
            <Pressable onPress={reset} hitSlop={10} accessibilityLabel="Reset chat">
              <Ionicons
                name="refresh-outline"
                size={20}
                color={Colors.light.mediumGrey}
              />
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                onPickProduct={onPickProduct}
                productPickEnabled={productPickEnabled}
              />
            )}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />

          {isProcessing ? (
            <View style={styles.typing}>
              <ActivityIndicator size="small" color={Colors.light.mediumGreen} />
              <Text style={styles.typingText}>Thinking…</Text>
            </View>
          ) : null}

          {quick && !isProcessing ? (
            <QuickActionBar
              title={quick.title}
              actions={quick.actions}
              disabled={isProcessing}
              onPress={onQuick}
            />
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder='Try "Fortune mustard oil"'
              placeholderTextColor={Colors.light.mediumLightGrey}
              style={styles.input}
              editable={!isProcessing}
              returnKeyType="send"
              onSubmitEditing={onSend}
              blurOnSubmit={false}
            />
            <Pressable
              onPress={onSend}
              disabled={isProcessing || !input.trim()}
              style={({ pressed }) => [
                styles.sendBtn,
                (!input.trim() || isProcessing) && styles.sendBtnDisabled,
                pressed && styles.sendBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send"
            >
              <Ionicons name="send" size={18} color={Colors.light.white} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScreenSafeWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 8,
    gap: 12,
  },
  metaText: {
    flex: 1,
    ...fonts.defaultMedium,
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  metaNumber: {
    ...fonts.defaultNumber,
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  bubbleRow: {
    marginBottom: 10,
    flexDirection: "row",
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "92%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.light.darkGreen,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.light.softGrey_1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    ...fonts.defaultMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleNumber: {
    ...fonts.defaultNumber,
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: { color: Colors.light.white },
  bubbleTextAssistant: { color: Colors.light.darkGreen },
  chips: {
    marginTop: 10,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.white,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.lightGrey,
  },
  chipDisabled: { opacity: 0.45 },
  chipPressed: { opacity: 0.75 },
  chipIndexWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.softGrey_1,
  },
  chipIndex: {
    ...fonts.defaultNumber,
    fontSize: 13,
    color: Colors.light.darkGreen,
  },
  chipImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.light.softGrey_1,
  },
  chipBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chipName: {
    ...fonts.defaultMedium,
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.darkGreen,
  },
  chipMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipSize: {
    ...fonts.defaultMedium,
    fontSize: 11,
    color: Colors.light.mediumGrey,
    flexShrink: 1,
  },
  chipPrice: {
    ...fonts.defaultNumber,
    fontSize: 12,
    color: Colors.light.darkGreen,
  },
  moreBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.white,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.lightGrey,
  },
  moreBtnText: {
    ...fonts.defaultSemiBold,
    fontSize: 13,
    color: Colors.light.darkGreen,
  },
  quickBar: {
    paddingTop: 4,
    paddingBottom: 6,
    gap: 6,
  },
  quickTitle: {
    ...fonts.defaultMedium,
    fontSize: 11,
    color: Colors.light.mediumGrey,
    paddingHorizontal: 4,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  quickChip: {
    minWidth: 52,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.lightGrey,
    backgroundColor: Colors.light.white,
  },
  quickChipYes: {
    backgroundColor: Colors.light.mediumGreen,
    borderColor: Colors.light.mediumGreen,
  },
  quickChipNo: {
    backgroundColor: Colors.light.white,
    borderColor: Colors.light.mediumGrey,
  },
  quickChipQty: {
    minWidth: 44,
    backgroundColor: Colors.light.softGrey_1,
    borderColor: Colors.light.lightGrey,
  },
  quickChipDisabled: { opacity: 0.4 },
  quickChipText: {
    ...fonts.defaultSemiBold,
    fontSize: 14,
    color: Colors.light.darkGreen,
  },
  quickChipTextYes: {
    color: Colors.light.white,
  },
  quickChipTextNo: {
    color: Colors.light.darkGreen,
  },
  quickChipTextQty: {
    ...fonts.defaultNumber,
    fontSize: 15,
    color: Colors.light.darkGreen,
  },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  typingText: {
    ...fonts.defaultMedium,
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 4 : 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    backgroundColor: Colors.light.softGrey_1,
    ...fonts.defaultMedium,
    // iOS Safari zooms focused inputs when font-size < 16px on mobile web
    fontSize: Platform.OS === "web" ? 16 : 15,
    color: Colors.light.darkGreen,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.mediumGreen,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnPressed: { opacity: 0.85 },
});
