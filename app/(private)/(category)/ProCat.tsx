import { StyleSheet, Text, View } from "react-native";
import React, { memo, useEffect } from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import TryAgain from "./CategoryList/TryAgain";
import { Colors } from "@/constants/Colors";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import CategoryList from "./CategoryList/CategoryList";
import Products from "./ProductList/Products";
import CategoryListWrapper from "./ProductList/CategoryListWrapper";
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
  console.log("procat",id, name, selectedCategoryIdIndex);
  return (
    <>
      <ScreenSafeWrapper showCartIcon={true} title={name} showSearchIcon={true} wrapperStyle={{paddingBottom:0,marginBottom:0}} >
        <>
          {isCategoryFetchingError ? (
            <TryAgain refetch={()=>{}} />
          ) : (
            <>
              <CategoryListWrapper>
                <DeferredFadeIn delay={0}>
                  <CategoryList
                    contentContainerStyle={{ paddingHorizontal: 30 }}
                    categories={getCategories?.children}
                    isCategoryFetching={isCategoryFetching}
                    selectedCategoryIdIndex={selectedCategoryIdIndex}
                    parentCategory={{ _id: id, name: name }}
                  />
                </DeferredFadeIn>
              </CategoryListWrapper>
             

              <DeferredFadeIn style={{ flex: 1 }} delay={200}>
                <Products isCategoryFetching={isCategoryFetching} />
              </DeferredFadeIn>
            </>
          )}
        </>
        {/* )} */}
        

      </ScreenSafeWrapper>

      <GoToCartWrapper showGoToCart={true} />
    </>
  );
};

export default memo(ProCat);

const styles = StyleSheet.create({});
