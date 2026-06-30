import {
  buildAdminOfferMilestones,
  getNextMilestone,
  getOfferShortLabel,
  getUnlockedMilestones,
} from "@/utils/offerMilestones";
import type { OfferDocument } from "@/types/global";

describe("offerMilestones", () => {
  it("returns all reward labels at the next threshold", () => {
    const offers: OfferDocument[] = [
      {
        id: "freebie",
        enabled: true,
        type: "freebie",
        minOrderValue: 1000,
        sortOrder: 1,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "flat",
        enabled: true,
        type: "discount",
        minOrderValue: 1500,
        sortOrder: 1,
        discount: { kind: "flat", value: 100, label: "₹100 off" },
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "pct",
        enabled: true,
        type: "discount",
        minOrderValue: 1500,
        sortOrder: 1,
        discount: { kind: "percent", value: 5, label: "5% off" },
        createdAt: "",
        updatedAt: "",
      },
    ];

    const milestones = buildAdminOfferMilestones(offers);
    const next = getNextMilestone(milestones, 1360);

    expect(next).toEqual({
      remaining: 140,
      rewardLabels: ["₹100 off", "5% off"],
    });
  });

  it("returns unlocked milestones with short labels", () => {
    const offers: OfferDocument[] = [
      {
        id: "freebie",
        enabled: true,
        type: "freebie",
        minOrderValue: 1000,
        sortOrder: 1,
        freebies: [
          {
            productId: "p1",
            quantity: 1,
            promoPrice: 5,
            label: "Maida2",
          },
        ],
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "flat",
        enabled: true,
        type: "discount",
        minOrderValue: 1500,
        sortOrder: 1,
        discount: { kind: "flat", value: 100, label: "₹100 off" },
        createdAt: "",
        updatedAt: "",
      },
    ];

    const milestones = buildAdminOfferMilestones(offers);
    const unlocked = getUnlockedMilestones(milestones, 1600);

    expect(unlocked.map((m) => m.shortLabel)).toEqual([
      "Maida2 at ₹5",
      "₹100 off",
    ]);
  });

  it("builds short discount labels without threshold", () => {
    expect(
      getOfferShortLabel({
        type: "discount",
        discount: { kind: "percent", value: 5, maxDiscount: 100 },
      }),
    ).toBe("5% off (max ₹100)");
  });

  it("builds descriptive freebie labels with product name", () => {
    const offers: OfferDocument[] = [
      {
        id: "freebie",
        enabled: true,
        type: "freebie",
        minOrderValue: 1000,
        sortOrder: 1,
        freebies: [
          {
            productId: "p1",
            quantity: 1,
            promoPrice: 5,
            label: "Maida2",
          },
        ],
        createdAt: "",
        updatedAt: "",
      },
    ];

    expect(buildAdminOfferMilestones(offers)[0].rewardLabel).toBe(
      "Maida2 at ₹5 on ₹1000+ orders",
    );
  });
});
