import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recentlyViewedItems';

// Async thunk to load initial data
export const loadRecentlyViewed = createAsyncThunk(
  'recentlyViewed/loadItems',
  async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading recently viewed items:', error);
      return [];
    }
  }
);

// Async thunk to save items
export const saveRecentlyViewed = createAsyncThunk(
  'recentlyViewed/saveItems',
  async (items) => {
    try {
      const jsonValue = JSON.stringify(items);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving recently viewed items:', error);
    }
  }
);

const recentlyViewedSlice = createSlice({
  name: 'recentlyViewed',
  initialState: {
    items: [],
    maxItems: 10,
    isLoading: false,
    error: null
  },
  reducers: {
    addCategoryView: (state, action) => {
      const newItem = {
        id: action.payload.id,
        type: 'category',
        name: action.payload.name,
        timestamp: Date.now(),
        parentCategoryId: action.payload.parentCategoryId,
        parentCategoryName: action.payload.parentCategoryName,
        selectedCategoryIdIndex: action.payload.selectedCategoryIdIndex,
      };
      
      // Remove duplicate if exists
      state.items = state.items.filter(item => 
        !(item.type === 'category' && item.id === newItem.id)
      );
      
      // Add to the beginning of the array
      state.items.unshift(newItem);
      
      // Trim if exceeds max length
      if (state.items.length > state.maxItems) {
        state.items = state.items.slice(0, state.maxItems);
      }
    },
    
    addProductView: (state, action) => {
      const newItem = {
        id: action.payload.id,
        type: 'product',
        name: action.payload.name,
        image: action.payload.image,
        price: action.payload.price,
        timestamp: Date.now(),
        discountedPrice: action.payload.discountedPrice,

      };
      
      // Remove duplicate if exists
      state.items = state.items.filter(item => 
        !(item.type === 'product' && item.id === newItem.id)
      );
      
      // Add to the beginning of the array
      state.items.unshift(newItem);
      
      // Trim if exceeds max length
      if (state.items.length > state.maxItems) {
        state.items = state.items.slice(0, state.maxItems);
      }
    },
    
    addSearchQuery: (state, action) => {
      const newItem = {
        id: `search-${Date.now()}`,
        type: 'search',
        query: action.payload.query,
        timestamp: Date.now()
      };
      
      // Add to the beginning of the array
      state.items.unshift(newItem);
      
      // Trim if exceeds max length
      if (state.items.length > state.maxItems) {
        state.items = state.items.slice(0, state.maxItems);
      }
    },
    
    clearRecentlyViewed: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadRecentlyViewed.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadRecentlyViewed.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(loadRecentlyViewed.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  }
});

export const { 
  addCategoryView, 
  addProductView, 
  addSearchQuery, 
  clearRecentlyViewed 
} = recentlyViewedSlice.actions;

export default recentlyViewedSlice.reducer;