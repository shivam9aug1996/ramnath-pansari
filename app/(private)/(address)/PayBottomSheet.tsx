import { StyleSheet, Text, View } from "react-native";
import React, { memo, useTransition } from "react";
import BottomSheet from "@/components/BottomSheet";
import Button from "@/components/Button";
import { Colors } from "@/constants/Colors";
import { formatNumber } from "@/utils/utils";
import { ThemedText } from "@/components/ThemedText";

const PayBottomSheet = ({
  setIsPayModal,
  data,
  isButtonLoading,
  totalAmountInNumber,
  selectedAddressId,
  handleOnClick,
  handleCod,
}) => {
  const [isPending, startTransition] = useTransition();

  return (
    <BottomSheet
      animation={false}
      onClose={() => {
        console.log("closed");
        setIsPayModal(false);
      }}
    >
      <View style={{ paddingHorizontal: 30, gap: 20 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <Text style={styles.totalPrice}>
            {`₹ ${formatNumber(totalAmountInNumber)}`}
          </Text>
        </View>
        <Button
          disabled={isButtonLoading}
          //isLoading={isButtonLoading}
          title={`Pay Online`}
          onPress={() => {
            const addressData = data?.find((item) => {
              return item?._id == selectedAddressId;
            });
            console.log("kjhyt567890-", addressData, totalAmountInNumber);
            // setIsPayModal({
            //   status: true,
            //   value: {
            //     totalAmountInNumber,
            //     addressData,
            //   },
            // });
            startTransition(() => {
              setIsPayModal(false);
            });
            handleOnClick(totalAmountInNumber, addressData);
          }}
          textStyle={{ fontFamily: "Montserrat_600SemiBold" }}
        />
        <Text style={{ alignSelf: "center" }}>or</Text>
        <Button
        disabled={isButtonLoading}
          // isLoading={isButtonLoading}
          title={`Cash on Delivery`}
          onPress={() => {
            const addressData = data?.find((item) => {
              return item?._id == selectedAddressId;
            });
            console.log("kjhyt567890-", addressData, totalAmountInNumber);
            // setIsPayModal({
            //   status: true,
            //   value: {
            //     totalAmountInNumber,
            //     addressData,
            //   },
            // });
            // handleOnClick(totalAmountInNumber, addressData);
            startTransition(() => {
              setIsPayModal(false);
            });
            handleCod(totalAmountInNumber, addressData);
          }}
          textStyle={{ fontFamily: "Montserrat_600SemiBold" }}
          wrapperStyle={{ marginTop: 0 }}
        />
      </View>
    </BottomSheet>
  );
};

export default memo(PayBottomSheet);

const styles = StyleSheet.create({
  totalPrice: {
    fontSize: 40,
    fontFamily: "Montserrat_600SemiBold",
    color: Colors.light.lightGreen,
  },
});
