import { Platform, StyleSheet } from "react-native";
import { devError, devLog } from "@/utils/devLog";
import { useState } from "react";
import {
  useCreatePreOrderMutation,
  usePlaceCodOrderMutation,
  useVerifyPreOrderMutation,
} from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { useDispatch, useSelector } from "react-redux";
import { Colors } from "@/constants/Colors";
import {
  setOrderSuccessView,
  useClearCartMutation,
  useLazyFetchCartQuery,
} from "@/redux/features/cartSlice";
import { router } from "expo-router";
import { showToast } from "@/utils/utils";
import { getLockableProductIds } from "@/utils/cartOfferUtils";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import {
  checkDeliveryRadius,
  getStoreClosedMessage,
  canAcceptOrders,
} from "@/utils/storeConfig";
import { openRazorpayWebCheckout } from "@/utils/razorpayWeb";

interface PreOrderResponse {
  data: {
    amount: number;
    id: string;
  };
}

const isLive =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ? false
    : true;

const getRazorpayKey = () => {
  const key = isLive
    ? process.env.EXPO_PUBLIC_RAZORPAY_KEY_LIVE
    : process.env.EXPO_PUBLIC_RAZORPAY_KEY_TEST;

  if (!key) {
    throw new Error(
      "Razorpay key is not configured. Please check your environment variables.",
    );
  }
  return key;
};

const usePayment = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.auth?.userData);
  const userId = userInfo?._id;
  const [clearCart] = useClearCartMutation();
  const [fetchCartData] = useLazyFetchCartQuery();

  const [
    createPreOrder,
    { isLoading: isCreatingOrder, error: createOrderError },
  ] = useCreatePreOrderMutation();
  const [
    placeCodOrder,
    { isLoading: isCreatingCodOrder, error: createCodOrderError },
  ] = usePlaceCodOrderMutation();
  const [
    verifyPreOrder,
    { isLoading: isVerifyingOrder, error: verifyOrderError },
  ] = useVerifyPreOrderMutation();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isRazorpayOpened, setIsRazorpayOpened] = useState(false);
  const storeConfig = useStoreConfig();

  const validateBeforePayment = (addressData: any): string | null => {
    if (!canAcceptOrders(storeConfig)) {
      return getStoreClosedMessage(storeConfig);
    }

    const lat = Number(addressData?.latitude);
    const lng = Number(addressData?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return "Delivery address location is required.";
    }

    const { isWithin } = checkDeliveryRadius(
      { latitude: lat, longitude: lng },
      storeConfig.deliveryRadius,
    );
    if (!isWithin) {
      return `Sorry, we only deliver within ${storeConfig.deliveryRadius.radiusKm} km of the store.`;
    }

    return null;
  };

  const extractProductIds = (cartData: any) =>
    getLockableProductIds(cartData?.cart?.items ?? []);

  const buildCheckoutOptions = (razorpayOrderId: string, amount: number) => ({
    description: "shopping",
    currency: "INR",
    key: getRazorpayKey(),
    amount: isLive ? 2 : amount,
    name: "Ramnath Kirana",
    order_id: razorpayOrderId,
    prefill: {
      email: "",
      contact: userInfo?.mobileNumber ?? "",
      name: userInfo?.name ?? "",
    },
    theme: { color: Colors.light.lightGreen },
  });

  const completeVerifiedPayment = async (
    paymentData: Record<string, unknown>,
    razorpayOrderId: string,
    addressData: any,
  ) => {
    dispatch(setOrderSuccessView(true));
    const cartData = await fetchCartData({ userId }, true)?.unwrap();
    const verifyResponse = await verifyPreOrder({
      ...paymentData,
      isLive,
      order_id: razorpayOrderId,
      cartData,
      addressData,
      userId,
    }).unwrap();

    if (verifyResponse?.verified) {
      await clearCart({
        body: {},
        params: { userId },
      }).unwrap();
      await fetchCartData({ userId }, false)?.unwrap();
      if (verifyResponse?.orderId) {
        router.dismissTo("/(tabs)/home");
        router.push("/(order)/order");
        router.push(`/(orderDetail)/${verifyResponse?.orderId}`);
      } else {
        router.dismissAll();
      }
    } else {
      dispatch(setOrderSuccessView(false));
      showToast({ type: "error", text2: "Payment not verified" });
    }
  };

  const openNativeRazorpay = async (
    options: ReturnType<typeof buildCheckoutOptions>,
    razorpayOrderId: string,
    addressData: any,
  ) => {
    const RazorpayCheckout = (await import("react-native-razorpay")).default;
    setIsRazorpayOpened(true);

    return RazorpayCheckout.open(options)
      .then(async (data) => {
        try {
          await completeVerifiedPayment(data, razorpayOrderId, addressData);
        } catch (verifyError: any) {
          dispatch(setOrderSuccessView(false));
          devLog("[product-lock] payment:online:verify-failed", {
            userId,
            status: verifyError?.status,
            data: verifyError?.data,
          });
          showToast({
            type: "error",
            text2:
              verifyError?.data?.message ||
              "Payment received but order could not be placed. Please contact support.",
          });
        }
      })
      .catch((error) => {
        devError("Payment failed:", error);
        showToast({
          type: "error",
          text2: error?.description || "Payment failed",
        });
      })
      .finally(() => {
        setIsPaymentProcessing(false);
        setIsRazorpayOpened(false);
      });
  };

  const openWebRazorpay = async (
    options: ReturnType<typeof buildCheckoutOptions>,
    razorpayOrderId: string,
    addressData: any,
  ) => {
    setIsRazorpayOpened(true);
    try {
      const data = await openRazorpayWebCheckout(options);
      try {
        await completeVerifiedPayment(data, razorpayOrderId, addressData);
      } catch (verifyError: any) {
        dispatch(setOrderSuccessView(false));
        devLog("[product-lock] payment:online:verify-failed", {
          userId,
          platform: "web",
          status: verifyError?.status,
          data: verifyError?.data,
        });
        showToast({
          type: "error",
          text2:
            verifyError?.data?.message ||
            "Payment received but order could not be placed. Please contact support.",
        });
      }
    } catch (error: any) {
      devError("Payment failed (web):", error);
      showToast({
        type: "error",
        text2: error?.description || error?.message || "Payment failed",
      });
    } finally {
      setIsPaymentProcessing(false);
      setIsRazorpayOpened(false);
    }
  };

  const handleOnClick = async (amount: number, addressData: any) => {
    try {
      const placementError = validateBeforePayment(addressData);
      if (placementError) {
        showToast({ type: "info", text2: placementError });
        return;
      }

      setIsPaymentProcessing(true);

      const cartData = await fetchCartData({ userId }, true)?.unwrap();
      const productIds = extractProductIds(cartData);
      devLog("[product-lock] payment:online:start", {
        userId,
        productIds,
        amount,
        platform: Platform.OS,
      });

      const res: PreOrderResponse = await createPreOrder({
        isLive,
        amount,
        userId,
        productIds,
      }).unwrap();
      const chargedAmount =
        typeof (res as { expectedAmount?: number }).expectedAmount === "number"
          ? (res as { expectedAmount: number }).expectedAmount
          : amount;
      devLog("[product-lock] payment:online:pre-order-created", {
        userId,
        razorpayOrderId: res.data.id,
        chargedAmount,
      });

      const options = buildCheckoutOptions(res.data.id, chargedAmount);

      if (Platform.OS === "web") {
        await openWebRazorpay(options, res.data.id, addressData);
      } else {
        await openNativeRazorpay(options, res.data.id, addressData);
      }
    } catch (error: any) {
      devLog("[product-lock] payment:online:pre-order-failed", {
        userId,
        status: error?.status,
        data: error?.data,
      });
      const message =
        error?.data?.message ||
        error?.data?.error ||
        "We're experiencing issues with online payments.";
      showToast({
        type: "error",
        text2: message,
      });
      devError("Order creation failed:", error);
      setIsPaymentProcessing(false);
    }
  };

  const handleCod = async (amount: number, addressData: any) => {
    try {
      const placementError = validateBeforePayment(addressData);
      if (placementError) {
        showToast({ type: "info", text2: placementError });
        return;
      }

      setIsPaymentProcessing(true);

      const cartData = await fetchCartData({ userId }, true)?.unwrap();
      const productIds = extractProductIds(cartData);
      devLog("[product-lock] payment:cod:start", {
        userId,
        productIds,
        amount,
      });
      const verifyResponse = await placeCodOrder({
        isLive,
        cartData,
        addressData,
        userId,
        amount,
      }).unwrap();

      await clearCart({
        body: {},
        params: { userId },
      }).unwrap();
      await fetchCartData({ userId }, false)?.unwrap();
      dispatch(setOrderSuccessView(true));
      router.dismissTo("/(tabs)/home");
      router.push("/(order)/order");
      router.push(`/(orderDetail)/${verifyResponse?.orderId}`);
    } catch (error: any) {
      devLog("[product-lock] payment:cod:failed", {
        userId,
        status: error?.status,
        data: error?.data,
      });
      const message =
        error?.data?.message ||
        "Unable to place order. Please review your cart and try again.";
      showToast({
        type: "error",
        text2: message,
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  return {
    handleOnClick,
    handleCod,
    isCreatingOrder: isCreatingOrder || isCreatingCodOrder,
    createOrderError: createOrderError || createCodOrderError,
    isVerifyingOrder,
    verifyOrderError,
    isPaymentProcessing,
    isRazorpayOpened,
  };
};

export default usePayment;

const styles = StyleSheet.create({});
