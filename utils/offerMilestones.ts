import { FREE_DELIVERY_MIN } from "@/constants/Delivery";
import { OfferDocument } from "@/types/global";
import { Ionicons } from "@expo/vector-icons";

function formatOfferAmount(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export type OfferMilestone = {
  id: string;
  threshold: number;
  icon: keyof typeof Ionicons.glyphMap;
  /** Full label — used in price breakdown rows. */
  rewardLabel: string;
  /** Compact label — used in cart promo badges when unlocked. */
  shortLabel: string;
};

export function buildDeliveryMilestone(
  freeDeliveryMin = FREE_DELIVERY_MIN,
): OfferMilestone {
  return {
    id: "delivery",
    threshold: freeDeliveryMin,
    icon: "bicycle-outline",
    rewardLabel: "FREE delivery",
    shortLabel: "FREE delivery",
  };
}

/** Admin-configured offer milestones only (excludes free delivery). */
export function buildAdminOfferMilestones(
  offers: OfferDocument[] = [],
): OfferMilestone[] {
  return [...offers]
    .filter((o) => o.enabled)
    .sort((a, b) => a.minOrderValue - b.minOrderValue)
    .map((offer) => ({
      id: offer.id,
      threshold: offer.minOrderValue,
      icon:
        offer.type === "freebie"
          ? ("gift-outline" as const)
          : ("pricetag-outline" as const),
      rewardLabel: getOfferLabel(offer),
      shortLabel: getOfferShortLabel(offer),
    }));
}

export function buildOfferMilestones(
  offers: OfferDocument[] = [],
  freeDeliveryMin = FREE_DELIVERY_MIN,
): OfferMilestone[] {
  return [buildDeliveryMilestone(freeDeliveryMin), ...buildAdminOfferMilestones(offers)];
}

/** Milestones to show in cart chrome — delivery only when no admin offers exist. */
export function buildVisibleCartMilestones(
  offers: OfferDocument[] = [],
  freeDeliveryMin = FREE_DELIVERY_MIN,
): OfferMilestone[] {
  const adminOffers = buildAdminOfferMilestones(offers);
  if (adminOffers.length === 0) {
    return [buildDeliveryMilestone(freeDeliveryMin)];
  }
  return buildOfferMilestones(offers, freeDeliveryMin);
}

export function shouldShowCartPromoIncentive(
  offers: OfferDocument[] = [],
  paidSubtotal: number,
): boolean {
  const adminOffers = buildAdminOfferMilestones(offers);
  if (adminOffers.length > 0) return true;
  return paidSubtotal >= 0;
}

export function hasDeliveryOnlyUnlocked(
  offers: OfferDocument[] = [],
  paidSubtotal: number,
  freeDeliveryMin = FREE_DELIVERY_MIN,
): boolean {
  return (
    buildAdminOfferMilestones(offers).length === 0 &&
    paidSubtotal >= freeDeliveryMin
  );
}

export type OfferLabelInput = {
  type: string;
  minOrderValue?: number;
  discount?: {
    kind?: string;
    value?: number;
    maxDiscount?: number;
    label?: string;
  };
  freebies?: {
    label?: string;
    promoPrice?: number;
    productSnapshot?: { name?: string };
  }[];
};

function formatOfferThreshold(minOrderValue?: number): string {
  if (minOrderValue == null || minOrderValue <= 0) return "";
  return ` on ₹${formatOfferAmount(minOrderValue)}+ orders`;
}

function getDiscountRewardPhrase(
  discount: NonNullable<OfferLabelInput["discount"]>,
): string {
  if (discount.label?.trim()) return discount.label.trim();

  if (discount.kind === "percent") {
    const cap =
      discount.maxDiscount != null
        ? ` (max ₹${formatOfferAmount(discount.maxDiscount)})`
        : "";
    return `${discount.value}% off${cap}`;
  }

  return `₹${formatOfferAmount(discount.value ?? 0)} off`;
}

function getFreebieRewardPhrase(
  freebie: NonNullable<OfferLabelInput["freebies"]>[number],
): string {
  const name =
    freebie.label?.trim() || freebie.productSnapshot?.name?.trim() || "";

  if (freebie.promoPrice === 0) {
    return name ? `Free ${name}` : "Free gift";
  }

  if (freebie.promoPrice != null) {
    return name
      ? `${name} at ₹${formatOfferAmount(freebie.promoPrice)}`
      : `Gift at ₹${formatOfferAmount(freebie.promoPrice)}`;
  }

  return name || "Special gift";
}

/** Compact badge text — type of reward without the order threshold. */
export function getOfferShortLabel(offer: OfferLabelInput): string {
  if (offer.type === "discount" && offer.discount) {
    return getDiscountRewardPhrase(offer.discount);
  }

  const freebie = offer.freebies?.[0];
  if (offer.type === "freebie" && freebie) {
    return getFreebieRewardPhrase(freebie);
  }

  return "Special offer";
}

/** Human-readable offer label for cart milestones, breakdown rows, and admin lists. */
export function getOfferLabel(offer: OfferLabelInput): string {
  const threshold = formatOfferThreshold(offer.minOrderValue);

  if (offer.type === "discount" && offer.discount) {
    return `${getDiscountRewardPhrase(offer.discount)}${threshold}`;
  }

  const freebie = offer.freebies?.[0];
  if (offer.type === "freebie" && freebie) {
    return `${getFreebieRewardPhrase(freebie)}${threshold}`;
  }

  return `Special offer${threshold}`;
}

export function getNextMilestone(
  milestones: OfferMilestone[],
  subtotal: number,
): { remaining: number; rewardLabels: string[] } | null {
  const nextThreshold = milestones.find(
    (milestone) => subtotal < milestone.threshold,
  )?.threshold;

  if (nextThreshold == null) return null;

  const rewardLabels = milestones
    .filter((milestone) => milestone.threshold === nextThreshold)
    .map((milestone) => milestone.shortLabel);

  return {
    remaining: nextThreshold - subtotal,
    rewardLabels,
  };
}

export function getUnlockedMilestones(
  milestones: OfferMilestone[],
  subtotal: number,
): OfferMilestone[] {
  return milestones.filter((milestone) => subtotal >= milestone.threshold);
}

export function getMaxMilestoneThreshold(
  milestones: OfferMilestone[],
  freeDeliveryMin = FREE_DELIVERY_MIN,
): number {
  if (!milestones.length) return freeDeliveryMin;
  return Math.max(...milestones.map((m) => m.threshold));
}
