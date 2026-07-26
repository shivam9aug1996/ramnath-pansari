import React, { useEffect } from "react";

import AppHead from "@/components/AppHead";
import ProCat from "./ProCat";
import { useLocalSearchParams } from "expo-router";
import { ItemTaskQueue } from "@/utils/ItemTaskQueueManager";
import { useSelector } from "react-redux";
const ProductScreen = () => {
  const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
    id: string;
    name?: string;
    selectedCategoryIdIndex?: string;
  }>();
  // const subCategoryName = useSelector((state: any) => state.category.catgeoryData.children[selectedCategoryIdIndex].name);
  // console.log('subCategoryName', subCategoryName);
  return (
    <>
     
      <ProCat
        id={id}
        name={name}
        selectedCategoryIdIndex={parseInt(selectedCategoryIdIndex)}
      />
    </>
  );
};

export default ProductScreen;
