import React, { useEffect } from "react";

import ProCat from "./ProCat";
import { useLocalSearchParams } from "expo-router";
import { ItemTaskQueue } from "@/utils/ItemTaskQueueManager";
const ProductScreen = () => {
  const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
    id: string;
    name?: string;
    selectedCategoryIdIndex?: string;
  }>();



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
