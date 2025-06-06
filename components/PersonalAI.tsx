import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useSelector } from 'react-redux';
import { RootState } from '@/types/global';
import { useFetchCartQuery } from '@/redux/features/cartSlice';

const PersonalAI = () => {
    const userId = useSelector((state: RootState) => state.auth?.userData?._id);
    const {
      data: cartData,
      isLoading,
      isSuccess,
      error,
      refetch,
    } = useFetchCartQuery({ userId }, { skip: !userId });
    console.log("cartData56789", JSON.stringify(cartData));
    const cartItems = cartData?.cart?.items?.length || 0;
    const { items } = useSelector(state => state.recentlyViewed);
    console.log("items56789", JSON.stringify(items));

  return (
    <View>
      <Text>PersonalAI</Text>
    </View>
  )
}

export default PersonalAI

const styles = StyleSheet.create({})