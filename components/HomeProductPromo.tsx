import React, { memo, useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import { useFetchHomePromoQuery } from "@/redux/features/homePromoSlice";
import { RootState, HomeProductPromoDocument } from "@/types/global";
import { ENABLE_HOME_PRODUCT_PROMO } from "@/utils/homeProductPromo";
import { Colors } from "@/constants/Colors";
import PromoVideoPlayer from "@/components/homePromo/PromoVideoPlayer";

/** Compact float card. */
const CARD_W = 92;
const CARD_H = 132;
const CARD_RADIUS = 14;

/** Inline banner below categories. */
const INLINE_H = 148;
const INLINE_VIDEO_W = 104;

type Variant = "float" | "inline";

type Props = {
  variant: Variant;
  /** Float only: called when user closes the floating card. */
  onFloatClose?: () => void;
};

function useHomePromo() {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const { data } = useFetchHomePromoQuery(undefined, {
    skip: !ENABLE_HOME_PRODUCT_PROMO || !token,
  });
  return data?.promo ?? null;
}

// --- Memoized Fullscreen Modal ---

type PromoFullscreenModalProps = {
  promo: HomeProductPromoDocument;
  visible: boolean;
  onClose: () => void;
  hasVideo: boolean;
  label: string;
};

const PromoFullscreenModal = memo(function PromoFullscreenModal({
  promo,
  visible,
  onClose,
  hasVideo,
  label,
}: PromoFullscreenModalProps) {
  const insets = useSafeAreaInsets();

  const handleViewProduct = useCallback(() => {
    const productId = promo.productId?.trim();
    onClose();
    if (productId) {
      router.push({
        pathname: "/(productDetail)/[id]" as any,
        params: { id: productId },
      });
    }
  }, [onClose, promo.productId]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <View style={[styles.modalTop, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {label}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close promo modal">
            <Ionicons name="close" size={28} color="#ffffff" />
          </Pressable>
        </View>

        <View style={styles.player}>
          {hasVideo && promo.videoUrl ? (
            <PromoVideoPlayer
              videoUrl={promo.videoUrl}
              posterUrl={promo.posterUrl}
              muted
              lockMute={false}
              controls
              objectFit="contain"
              style={styles.fill}
              active={visible}
            />
          ) : (
            <Image
              source={{ uri: promo.posterUrl }}
              style={styles.fill}
              contentFit="contain"
            />
          )}
        </View>

        <View style={[styles.modalBottom, { paddingBottom: insets.bottom + 16 }]}>
          {!!promo.productName && (
            <Text style={styles.productName}>{promo.productName}</Text>
          )}
          {!!promo.productId?.trim() && (
            <Pressable style={styles.cta} onPress={handleViewProduct}>
              <Text style={styles.ctaText}>
                {promo.ctaLabel || "View product"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
});

// --- Main Promo Component ---

const HomeProductPromo = ({ variant, onFloatClose }: Props) => {
  const promo = useHomePromo();
  const [expanded, setExpanded] = useState(false);

  const hasVideo = Boolean(promo?.videoUrl?.trim());

  const handleOpenModal = useCallback(() => {
    setExpanded(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setExpanded(false);
  }, []);

  const handleCloseFloat = useCallback(() => {
    setExpanded(false);
    onFloatClose?.();
  }, [onFloatClose]);

  if (!ENABLE_HOME_PRODUCT_PROMO || !promo) {
    return null;
  }

  const label = promo.title || promo.productName || "Featured";

  if (variant === "inline") {
    return (
      <>
        <Pressable
          onPress={handleOpenModal}
          style={styles.inlineCard}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={styles.inlineVideoWrap}>
            {hasVideo && promo.videoUrl ? (
              <PromoVideoPlayer
                videoUrl={promo.videoUrl}
                posterUrl={promo.posterUrl}
                muted
                lockMute
                controls={false}
                objectFit="cover"
                style={styles.mediaFill}
                active={!expanded}
              />
            ) : (
              <Image
                source={{ uri: promo.posterUrl }}
                style={styles.mediaFill}
                contentFit="cover"
              />
            )}
            <View style={styles.expandBadge}>
              <Ionicons name="expand-outline" size={13} color="#ffffff" />
            </View>
          </View>

          <View style={styles.inlineCopy}>
            <Text style={styles.inlineEyebrow}>Featured</Text>
            <Text style={styles.inlineTitle} numberOfLines={2}>
              {label}
            </Text>
            {!!promo.productName && promo.productName !== label && (
              <Text style={styles.inlineSub} numberOfLines={1}>
                {promo.productName}
              </Text>
            )}
            <View style={styles.inlineWatchRow}>
              <Ionicons
                name="expand-outline"
                size={18}
                color={Colors.light.darkGreen}
              />
              <Text style={styles.inlineWatch}>View fullscreen</Text>
            </View>
          </View>
        </Pressable>

        <PromoFullscreenModal
          promo={promo}
          visible={expanded}
          onClose={handleCloseModal}
          hasVideo={hasVideo}
          label={label}
        />
      </>
    );
  }

  return (
    <>
      <View pointerEvents="box-none" style={styles.anchor}>
        <Pressable
          onPress={handleOpenModal}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <View style={styles.cardMedia}>
            {hasVideo && promo.videoUrl ? (
              <PromoVideoPlayer
                videoUrl={promo.videoUrl}
                posterUrl={promo.posterUrl}
                muted
                lockMute
                controls={false}
                objectFit="cover"
                style={styles.mediaFill}
                active={!expanded}
              />
            ) : (
              <Image
                source={{ uri: promo.posterUrl }}
                style={styles.mediaFill}
                contentFit="cover"
              />
            )}
            <View style={styles.expandBadge}>
              <Ionicons name="expand-outline" size={13} color="#ffffff" />
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={handleCloseFloat}
          style={styles.dismissBtn}
          hitSlop={12}
          accessibilityLabel="Move promo to home"
        >
          <Ionicons name="close" size={14} color="#ffffff" />
        </Pressable>
      </View>

      <PromoFullscreenModal
        promo={promo}
        visible={expanded}
        onClose={handleCloseModal}
        hasVideo={hasVideo}
        label={label}
      />
    </>
  );
};

export default memo(HomeProductPromo);

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 120,
    width: CARD_W,
    height: CARD_H,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    backgroundColor: "#111111",
    padding: 2.5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  cardMedia: {
    flex: 1,
    borderRadius: CARD_RADIUS - 3,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "#111111",
  },
  mediaFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  expandBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  dismissBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    minHeight: INLINE_H,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EEF2",
    overflow: "hidden",
  },
  inlineVideoWrap: {
    width: INLINE_VIDEO_W,
    backgroundColor: "#111111",
  },
  inlineCopy: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    gap: 4,
  },
  inlineEyebrow: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 11,
    color: Colors.light.mediumGrey,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inlineTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
    color: Colors.light.darkGreen,
  },
  inlineSub: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
  },
  inlineWatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  inlineWatch: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 13,
    color: Colors.light.darkGreen,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalTitle: {
    color: "#ffffff",
    fontFamily: "Raleway_700Bold",
    fontSize: 18,
    flex: 1,
    marginRight: 12,
  },
  player: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fill: {
    width: "100%",
    height: "100%",
  },
  modalBottom: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  productName: {
    color: "#eeeeee",
    fontFamily: "Raleway_600SemiBold",
    fontSize: 15,
    textAlign: "center",
  },
  cta: {
    backgroundColor: Colors.light.lightGreen || "#2e7d32",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    color: "#ffffff",
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
  },
});