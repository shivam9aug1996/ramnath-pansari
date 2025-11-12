import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CategoryList from '../CategoryList/CategoryList'

const CatWrapper = () => {
  return (
    
    <CategoryList
    contentContainerStyle={{ paddingHorizontal: 30 }}
    categories={getCategories?.children}
    isCategoryFetching={isCategoryFetching}
    selectedCategoryIdIndex={selectedCategoryIdIndex}
    parentCategory={{ _id: id, name: name }}
  />
    
  )
}

export default CatWrapper

const styles = StyleSheet.create({})