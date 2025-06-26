import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch } from "react-redux";
import { setSelectedCategoryClicked, setSelectedSubCategoryId } from "@/redux/features/productSlice";
import CategorySelector from "./CategorySelector";
import SubCategorySelector from "./SubCategorySelector";
import { Category, CategoryListProps, SubCategory } from "@/types/global";
import SubCategorySelectorPlaceholder from "./SubCategorySelectorPlaceholder";
import CategorySelectorPlaceholder from "./CategorySelectorPlaceholder";
import { scrollToIndex, scrollToTop } from "../ProductList/utils";
import { getSubCategoryIndex } from "./utils";
import CustomSuspense from "@/components/CustomSuspense";
import { addCategoryView } from "@/redux/features/recentlyViewedSlice";
import { debounce } from "lodash";
import { setSubCategoryActionClicked } from "@/redux/features/categorySlice";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import { router } from "expo-router";
const CategoryList = ({
  categories,
  isCategoryFetching,
  selectedCategoryIdIndex=0,
  contentContainerStyle,
  parentCategory
}: CategoryListProps) => {
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const previousSelectedCategory = useRef<Category | null>(null); 

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(null);
  const subCatFlatListRef = useRef(null);

  const dispatch = useDispatch();

  // useEffect(() => {
  //   if (categories?.length > 0) {
  //     setSelectedCategory(categories[0]);
  //   }
  // }, [categories]);

  // useEffect(() => {
  //   if (categories?.length > 0) {
  //     setSelectedCategory(categories[0]);
  //   }
    
  // }, [selectedCategoryIdIndex, categories, parentCategory]);

  useEffect(() => {
    if (selectedCategoryIdIndex!==undefined && categories) {
      setSelectedCategory(categories[selectedCategoryIdIndex]);
    }
  }, [selectedCategoryIdIndex, categories]);

  // useEffect(() => {
  //   requestAnimationFrame(()=>{
  //     if (selectedCategory) {
  //       console.log("56789-4567898656786567890", selectedCategory);
  //       const updatedSubCategories = [
  //         { _id: "all", name: "All" },
  //         ...(selectedCategory.children || []),
  //       ];
  //       setSubCategories(updatedSubCategories);
  //       setSelectedSubCategory(updatedSubCategories[0]);
  //       scrollToTop(subCatFlatListRef);
       
  //     }
  //     if(parentCategory&&selectedCategory){
  //       dispatch(addCategoryView({
  //         id: selectedCategory._id,
  //         name: selectedCategory.name,
  //         parentCategoryId: parentCategory?._id,
  //         parentCategoryName: parentCategory?.name,
  //         selectedCategoryIdIndex: selectedCategoryIdIndex
  //       }));
  //     }
  //   })
  // }, [selectedCategory,parentCategory]);

  useEffect(() => {
    // Debounce function — triggers only once after 200ms of no changes
    const debouncedUpdate = debounce(() => {
      requestAnimationFrame(() => {
        if (selectedCategory) {
          // if(previousSelectedCategory.current === selectedCategory?._id){
          //   dispatch(setSubCategoryActionClicked(false));
          // }
         

          //console.log("previousSelectedCategory.current---->",previousSelectedCategory.current,selectedCategory?._id);

        //  console.log("56789-4567898656786567890", selectedCategory);
          const updatedSubCategories = [
            { _id: "all", name: "All" },
            ...(selectedCategory.children || []),
          ];
          setSubCategories(updatedSubCategories);
          console.log("selectedSubCategory234567890-",{selectedCategory,selectedSubCategory})
          setSelectedSubCategory(updatedSubCategories[0]);
          scrollToTop(subCatFlatListRef);
        // dispatch(setSubCategoryActionClicked(false));
        }
  
        if (parentCategory && selectedCategory) {
         // dispatch(setSubCategoryActionClicked(false));
          dispatch(addCategoryView({
            id: selectedCategory._id,
            name: selectedCategory.name,
            parentCategoryId: parentCategory?._id,
            parentCategoryName: parentCategory?.name,
            selectedCategoryIdIndex: selectedCategoryIdIndex
          }));
          //dispatch(setSubCategoryActionClicked(false));
        }
      });
    }, 200, {leading: true,trailing: false}); // 200ms debounce time
  
    debouncedUpdate();
  
    return () => {
      debouncedUpdate.cancel(); // Clean up on unmount or deps change
     // console.log("debouncedUpdate.cancel()",selectedSubCategory)
    };
  }, [selectedCategory, parentCategory]);
  

  // useEffect(() => {
  //   requestAnimationFrame(()=>{
  //     if (selectedSubCategory && !isCategoryFetching) {
  //       const subCategoryIndex = getSubCategoryIndex(
  //         subCategories,
  //         selectedSubCategory
  //       );
  //       scrollToIndex(subCatFlatListRef, subCategoryIndex);
  //       const selectedId =
  //         selectedSubCategory?._id === "all"
  //           ? selectedCategory
  //           : selectedSubCategory;
  //       dispatch(setSelectedSubCategoryId(selectedId));
  //     }
  //   })
  // }, [selectedSubCategory]);


useEffect(() => {
  // if(selectedSubCategory && !isCategoryFetching){
  //   dispatch(setSelectedCategoryClicked(true));
  // }
  const debouncedUpdate = debounce(() => {
    requestAnimationFrame(() => {
      if (selectedSubCategory && !isCategoryFetching) {

        const subCategoryIndex = getSubCategoryIndex(
          subCategories,
          selectedSubCategory
        );
        scrollToIndex(subCatFlatListRef, subCategoryIndex);
        
        const selectedId =
          selectedSubCategory?._id === "all"
            ? selectedCategory
            : selectedSubCategory;
           // console.log("selectedSubCa456789tegory---->",selectedId,previousSelectedCategory.current,selectedCategory?._id)
if(previousSelectedCategory.current === selectedId?._id){
  dispatch(setSubCategoryActionClicked(false));
}
            previousSelectedCategory.current = selectedId?._id;

        dispatch(setSelectedSubCategoryId(selectedId));
       // dispatch(setSubCategoryActionClicked(false));
      }
    });
  }, 200); // 200ms debounce

  debouncedUpdate();

  return () => {
    debouncedUpdate.cancel(); // cleanup
  };
}, [selectedSubCategory, subCategories, selectedCategory, isCategoryFetching]);

const handleSelectCategory = (category: Category) => {
  console.log("category",category)
  const index = categories.findIndex(c => c._id === category._id);
  setSelectedCategory(category);
  router.setParams({
    selectedCategoryIdIndex: index?.toString()
  })
}

  return (
    <View>
      {isCategoryFetching ? (
        <CategorySelectorPlaceholder
          contentContainerStyle={{ paddingHorizontal: 30 }}
        />
      ) : (
        
        //  <DeferredFadeIn delay={0} fallback={<CategorySelectorPlaceholder
        //   contentContainerStyle={{ paddingHorizontal: 30 }}
        // />}>
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            contentContainerStyle={contentContainerStyle}
         />
        //  </DeferredFadeIn>
        
      )}
      {isCategoryFetching ? (
        <SubCategorySelectorPlaceholder
          contentContainerStyle={{ paddingHorizontal: 30 }}
        />
      ) : (
        // <DeferredFadeIn delay={0} fallback={<SubCategorySelectorPlaceholder
        //   contentContainerStyle={{ paddingHorizontal: 30 }}
        // />}>
          <SubCategorySelector
            subCategories={subCategories}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={setSelectedSubCategory}
            subCatFlatListRef={subCatFlatListRef}
            contentContainerStyle={contentContainerStyle}
          />
          // </DeferredFadeIn>
      )}
    </View>
  );
};

export default memo(CategoryList);
