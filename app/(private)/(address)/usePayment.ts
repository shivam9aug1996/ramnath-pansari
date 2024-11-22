import { StyleSheet } from "react-native";
import { useState } from "react";
import {
  useCreatePreOrderMutation,
  useVerifyPreOrderMutation,
} from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { useSelector } from "react-redux";
import { Colors } from "@/constants/Colors";
import {
  useClearCartMutation,
  useLazyFetchCartQuery,
} from "@/redux/features/cartSlice";
import { router } from "expo-router";

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

const isLive = false;

// Separate function to create Razorpay options
const getRazorpayOptions = (
  amount: number,
  orderId: string,
  userInfo: { name: string; mobileNumber: string | undefined }
): RazorpayOptions => {
  return {
    description: "shopping",
    currency: "INR",
    key: isLive
      ? process.env.EXPO_PUBLIC_RAZORPAY_KEY_LIVE!
      : process.env.EXPO_PUBLIC_RAZORPAY_KEY!,
    amount: amount,
    name: "Ramnath Kirana",
    order_id: orderId,
    prefill: {
      email: "",
      contact: userInfo?.mobileNumber ?? "",
      name: userInfo?.name ?? "",
    },
    theme: { color: Colors.light.lightGreen },
  };
};

const usePayment = () => {
  console.log("iuytrdfgh", isLive);
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
    verifyPreOrder,
    { isLoading: isVerifyingOrder, error: verifyOrderError },
  ] = useVerifyPreOrderMutation();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isRazorpayOpened, setIsRazorpayOpened] = useState(false);

  const handleOnClick = async (amount: number, addressData: any) => {
    try {
      setIsPaymentProcessing(true);

      // console.log("gfhjkl;", data);

      const res: PreOrderResponse = await createPreOrder({
        isLive,
        amount,
      }).unwrap();
      console.log("iuytrfdfghjkl", res);
      const options = getRazorpayOptions(
        res.data.amount,
        res.data.id,
        userInfo
      );
      console.log("iuytrf876556789dfghjkl", options);

      const RazorpayCheckout = (await import("react-native-razorpay")).default;

      RazorpayCheckout.open(options)
        .then(async (data) => {
          setIsRazorpayOpened(true);
          const cartData = await fetchCartData({ userId }, true)?.unwrap();
          const verifyResponse = await verifyPreOrder({
            ...data,
            isLive,
            order_id: res.data.id,
            cartData,
            addressData,
            userId,
          }).unwrap();
          console.log("kufghfhgjhkjlk", verifyResponse);
          if (verifyResponse?.verified) {
            await clearCart({
              body: {},
              params: { userId },
            }).unwrap();
            console.log("payment verified");
            router.dismissAll();
            //router.navigate("/(home)/home");
            if (verifyResponse?.orderId) {
              router.navigate(`/(orderDetail)/${verifyResponse?.orderId}`);
            } else {
              router.navigate("/(home)/home");
            }

            // create order flow
          } else {
            console.log("payment not  verified");
            // create order with hold status
          }
        })
        .catch((error) => {
          console.log("Payment failed:", error);
        })
        .finally(() => {
          setIsPaymentProcessing(false);
          setIsRazorpayOpened(false);
        });
    } catch (error) {
      // console.error("Order creation failed:", error);
      setIsPaymentProcessing(false);
    }
  };

  return {
    handleOnClick,
    isCreatingOrder,
    createOrderError,
    isVerifyingOrder,
    verifyOrderError,
    isPaymentProcessing,
    isRazorpayOpened,
  };
};

export default usePayment;

const styles = StyleSheet.create({});