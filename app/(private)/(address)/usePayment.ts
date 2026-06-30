import { StyleSheet } from "react-native";
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

interface PreOrderResponse {
  data: {
    amount: number;
    id: string;
  };
}

interface RazorpayOptions {
  description: string;
  currency: string;
  key: string;
  amount: number;
  name: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
    name: string;
  };
  theme: {
    color: string;
  };
}

const isLive =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ? false
    : true;

// Function to safely get Razorpay key
const getRazorpayKey = () => {
  const key = isLive
    ? process.env.EXPO_PUBLIC_RAZORPAY_KEY_LIVE
    : process.env.EXPO_PUBLIC_RAZORPAY_KEY_TEST;
  
  if (!key) {
    throw new Error('Razorpay key is not configured. Please check your environment variables.');
  }
  return key;
};

// Separate function to create Razorpay options
const getRazorpayOptions = (
  amount: number,
  orderId: string,
  userInfo: { name: string; mobileNumber: string | undefined }
): RazorpayOptions => {
  try {
    return {
      description: "shopping",
      currency: "INR",
      key: getRazorpayKey(),
      amount: isLive ? 2 : amount,
      name: "Ramnath Kirana",
      order_id: orderId,
      prefill: {
        email: "",
        contact: userInfo?.mobileNumber ?? "",
        name: userInfo?.name ?? "",
      },
      theme: { color: Colors.light.lightGreen },
    };
  } catch (error) {
    console.error('Error creating Razorpay options:', error);
    throw error;
  }
};

const usePayment = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.auth?.userData);
  const userId = userInfo?._id;
  const [clearCart] = useClearCartMutation();
  const [
    fetchCartData,
    // {
    //   data: cartData,
    //   isLoading: isCartLoading,
    //   isSuccess: isCartSuccess,
    //   error: isCartError,
    // },
  ] = useLazyFetchCartQuery();

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

  const handleOnClick = async (amount: number, addressData: any) => {
    try {
      const placementError = validateBeforePayment(addressData);
      if (placementError) {
        showToast({ type: "info", text2: placementError });
        return;
      }

      setIsPaymentProcessing(true);

      amount = amount;

      const cartData = await fetchCartData({ userId }, true)?.unwrap();
      const productIds = extractProductIds(cartData);
      console.log("[product-lock] payment:online:start", {
        userId,
        productIds,
        amount,
      });

      const res: PreOrderResponse = await createPreOrder({
        isLive,
        amount,
        userId,
        productIds,
      }).unwrap();
      console.log("[product-lock] payment:online:pre-order-created", {
        userId,
        razorpayOrderId: res.data.id,
      });


      const options = {
        description: "shopping",
        currency: "INR",
        key: getRazorpayKey(),
        amount: isLive ? 2 : amount,
        name: "Ramnath Kirana",
        order_id: res.data.id,
        prefill: {
          email: "",
          contact: userInfo?.mobileNumber ?? "",
          name: userInfo?.name ?? "",
        },
        theme: { color: Colors.light.lightGreen },
      }

      const RazorpayCheckout = (await import("react-native-razorpay")).default;

      RazorpayCheckout.open(options)
        .then(async (data) => {
          try {
            dispatch(setOrderSuccessView(true));
            const cartData = await fetchCartData({ userId }, true)?.unwrap();
            const verifyResponse = await verifyPreOrder({
              ...data,
              isLive,
              order_id: res.data.id,
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
          } catch (verifyError: any) {
            dispatch(setOrderSuccessView(false));
            console.log("[product-lock] payment:online:verify-failed", {
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
          console.error("Payment failed:", error);
          showToast({
            type: "error",
            text2: error?.description || "Payment failed",
          });
        })
        .finally(() => {
          setIsPaymentProcessing(false);
          setIsRazorpayOpened(false);
        });
    } catch (error: any) {
      console.log("[product-lock] payment:online:pre-order-failed", {
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
      console.error("Order creation failed:", error);
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
      console.log("[product-lock] payment:cod:start", {
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
      console.log("[product-lock] payment:cod:failed", {
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
      // setTimeout(() => {
      //   dispatch(setOrderSuccessView(false));
      // }, 2500);
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
