import { router } from "expo-router";
import type { UiAction } from "./types";

/**
 * Native UI handoff — AI requests UI; React Native opens the screen.
 * After completion, conversation resumes with updated context.
 */
export function performUiHandoff(action: UiAction): void {
  switch (action.action) {
    case "OPEN_SEARCH_RESULTS":
      router.push(`/(result)/${encodeURIComponent(action.query)}`);
      break;
    case "OPEN_PRODUCT_DETAIL":
      router.push(`/(productDetail)/${action.productId}`);
      break;
    case "OPEN_CART":
      router.push("/(cartScreen)/cartScreen");
      break;
    case "OPEN_MAP_PICKER":
      router.push("/(address)/addAddress");
      break;
    case "OPEN_PAYMENT":
      router.push("/(address)/addressList");
      break;
    case "OPEN_LOGIN":
      router.push("/login");
      break;
    default:
      break;
  }
}
