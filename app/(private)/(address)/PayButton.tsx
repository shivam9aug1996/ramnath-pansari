import { StyleSheet, Text, View } from "react-native";
import React, { useCallback, useState } from "react";
import Button from "@/components/Button";
import usePayment from "./usePayment";

const PayButton = ({
  cartButtonProductId,
  totalAmount,
  data,
  totalAmountInNumber,
  selectedAddressId,
}) => {
  const { handleOnClick, isPaymentProcessing } = usePayment();
  const [needPayButton, setNeedPayButton] = useState(false);

  const didPress = useCallback(() => {
    setNeedPayButton(true);
  }, []);

  return (
    <Button
      disabled={cartButtonProductId?.length != 0 || isPaymentProcessing}
      isLoading={cartButtonProductId?.length != 0 || isPaymentProcessing}
      title={`Pay ${totalAmount}`}
      onPress={() => {
        const addressData = data?.find((item) => {
          return item?._id == selectedAddressId;
        });

        handleOnClick(totalAmountInNumber, addressData);
      }}
      textStyle={{ fontFamily: "Montserrat_600SemiBold" }}
    />
  );
};

export default PayButton;

const styles = StyleSheet.create({});
