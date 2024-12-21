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
import { Toast } from "toastify-react-native";

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
};

const usePayment = () => {
  const dispatch = useDispatch();
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
    placeCodOrder,
    { isLoading: isCreatingCodOrder, error: createCodOrderError },
  ] = usePlaceCodOrderMutation();
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
      amount = isLive ? 2 : amount;
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
          console.log("kufghfhgjhkjlk", verifyResponse);
          if (verifyResponse?.verified) {
            await clearCart({
              body: {},
              params: { userId },
            }).unwrap();
            console.log("payment verified");
            if (verifyResponse?.orderId) {
              router.dismissAll();
              setTimeout(() => {
                router.push(`/(orderDetail)/${verifyResponse?.orderId}`);
              }, 700);
              //router.navigate("/home");
              //router.dismissTo("/(address)/addressList");
              //router.push(`/(orderDetail)/${verifyResponse?.orderId}`);
            } else {
              router.dismissAll();
            }

            // create order flow
          } else {
            console.log("payment not  verified");
            Toast.error("payment not  verified");
            // create order with hold status
          }
        })
        .catch((error) => {
          console.log("Payment failed:", error);
          Toast.error(error?.description || "Payment failed");
        })
        .finally(() => {
          setIsPaymentProcessing(false);
          setIsRazorpayOpened(false);
        });
    } catch (error) {
      console.error("Order creation failed:", error);
      setIsPaymentProcessing(false);
    }
  };

  const handleCod = async (amount: number, addressData: any) => {
    try {
      setIsPaymentProcessing(true);
      //setIsRazorpayOpened(true);

      const cartData = await fetchCartData({ userId }, true)?.unwrap();
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
      dispatch(setOrderSuccessView(true));
      router.dismissAll();
      setTimeout(() => {
        router.push(`/(orderDetail)/${verifyResponse?.orderId}`);
      }, 700);
    } catch (error) {
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
