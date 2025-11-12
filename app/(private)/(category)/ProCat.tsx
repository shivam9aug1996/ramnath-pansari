import { StyleSheet, Text, View } from "react-native";
import React, { memo, useEffect } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import TryAgain from "./CategoryList/TryAgain";
import { Colors } from "@/constants/Colors";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import CategoryList from "./CategoryList/CategoryList";
import Products from "./ProductList/Products";
import GoToCartWrapper from "./ProductList/GoToCartWrapper";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { setSelectedSubCategoryId } from "@/redux/features/productSlice";

const ProCat = ({
  id,
  name,
  selectedCategoryIdIndex,
}: {
  id: string;
  name: string;
  selectedCategoryIdIndex: number;
}) => {
  const isCategoryFetching = false;
  const isCategoryFetchingError = false;

  const categoryData = useSelector(
    (state: RootState) => state?.category?.catgeoryData
  );
  const getCategories = categoryData;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setSelectedSubCategoryId("null"))
  }, [])
  console.log("name7654345645678987657890",name,id,selectedCategoryIdIndex)
  return (
    <>
      <ScreenSafeWrapper showCartIcon={true} title={name} showSearchIcon={true} wrapperStyle={{paddingBottom:0,marginBottom:0}} >
        <>
          {isCategoryFetchingError ? (
            <TryAgain refetch={()=>{}} />
          ) : (
            <>
              <View
                style={{
                  position: "absolute",
                  top: 45,
                  left: -30,
                  right: -30,
                  backgroundColor: Colors.light.background,
                  zIndex: 999,
                }}
              >
                <DeferredFadeIn delay={0}>
                  <CategoryList
                    contentContainerStyle={{ paddingHorizontal: 30 }}
                    categories={getCategories?.children}
                    isCategoryFetching={isCategoryFetching}
                    selectedCategoryIdIndex={selectedCategoryIdIndex}
                    parentCategory={{ _id: id, name: name }}
                  />
                </DeferredFadeIn>
              </View>
             

              <DeferredFadeIn style={{ flex: 1 }} delay={200}>
                <Products isCategoryFetching={isCategoryFetching} />
              </DeferredFadeIn>
            </>
          )}
        </>
        {/* )} */}
        

      </ScreenSafeWrapper>
      

      <DeferredFadeIn delay={100}>
        <GoToCartWrapper showGoToCart={true} />
      </DeferredFadeIn>
    </>
  );
};

export default memo(ProCat);

const styles = StyleSheet.create({});
