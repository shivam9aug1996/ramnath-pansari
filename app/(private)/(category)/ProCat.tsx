import { StyleSheet, Text, View } from 'react-native'
import React, { memo } from 'react'
import ScreenSafeWrapper from '@/components/ScreenSafeWrapper'
import TryAgain from './CategoryList/TryAgain'
import { Colors } from '@/constants/Colors'
import DeferredFadeIn from '@/components/DeferredFadeIn'
import CategoryList from './CategoryList/CategoryList'
import Products from './ProductList/Products'
import GoToCartWrapper from './ProductList/GoToCartWrapper'
import { useFetchCategoriesQuery } from '@/redux/features/categorySlice'
import { useSelector } from 'react-redux'
import { RootState } from '@/types/global'

const ProCat = ({id,name,selectedCategoryIdIndex}:{id:string,name:string,selectedCategoryIdIndex:number}) => {
    // const {
    //     data: getCategories,
    //     isFetching: isCategoryFetching,
    //     isError: isCategoryFetchingError,
    //     refetch,
    //   } = useFetchCategoriesQuery(
    //     {
    //       categoryId: id,
    //     },
    //     { skip: !id }
    //   );
    const isCategoryFetching = false;
    const isCategoryFetchingError = false;


      const categoryData = useSelector((state: RootState) => state?.category?.catgeoryData);
      const getCategories = categoryData;
  return (
    <>
      
        <ScreenSafeWrapper
          showCartIcon={true}
          title={name}
          showSearchIcon={true}
        >
          {/* {showWrapper && ( */}
          <>
            {isCategoryFetchingError ? (
              <TryAgain refetch={refetch} />
            ) : (
              <>
                {/* Categories */}
                {/* {showCategories ? ( */}
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
                {/* ) : null} */}

                <DeferredFadeIn style={{ flex: 1 }} delay={200}>
                  
                  <Products
                    
                    isCategoryFetching={isCategoryFetching}
                  />
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
  )
}

export default memo(ProCat)

const styles = StyleSheet.create({})