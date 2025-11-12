import { showToast } from "@/utils/utils";
import { clearAuthData } from "./features/authSlice";
import * as SecureStore from "expo-secure-store";

const PRODUCT_CACHE_PREFIX = "PRODUCT_CACHE_";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const productApiMiddleware = (store: any) => (next: any) => async (action: any) => {
  const url = action?.meta?.baseQueryMeta?.request?.url;
  console.log("45678ytfghjk",action?.type,action);
  
  if (url && url.includes("/api/products?categoryId")) {
    try {
      // Parse URL parameters
      const urlObj = new URL(url);
      const categoryId = urlObj.searchParams.get("categoryId");
      const page = urlObj.searchParams.get("page");
      const limit = urlObj.searchParams.get("limit");
      const reset = urlObj.searchParams.get("reset");
      console.log("123456789012345687678906547890",categoryId,page,limit,reset);
      
      // Only cache when page=1 and reset=false
      if (page == "1" && categoryId) {
        const cacheKey = `${PRODUCT_CACHE_PREFIX}${categoryId}_page1`;
        
        // Check if this is a response action (successful API call)
        if (action.type?.includes("fulfilled") && action.payload) {
          // Cache the successful response
          const cacheData = {
            timestamp: Date.now(),
            data: action.payload,
            categoryId,
            page: 1,
            limit: limit || "10"
          };
          
          await SecureStore.setItemAsync(cacheKey, JSON.stringify(cacheData));
          console.log(`✅ Cached products for category ${categoryId}, page 1`);
        }
        console.log("1234567890123456876547890",action.type);
        
        // Check if this is a pending action (API call starting)
        if (action.type?.includes("pending")) {
            console.log("1234567890");
          // Try to get cached data first
          const cachedString = await SecureStore.getItemAsync(cacheKey);
          if (cachedString) {
            console.log("12345678904567890");
            const cached = JSON.parse(cachedString);
            const now = Date.now();
            
            // Check if cache is still valid
            if (now - cached.timestamp < CACHE_DURATION) {
              console.log(`📦 Using cached products for category ${categoryId}, page 1`);
              
              // Create a fulfilled action with cached data
              const fulfilledAction = {
                ...action,
                type: action.type.replace("pending", "fulfilled"),
                payload: cached.data,
                meta: {
                  ...action.meta,
                  requestId: action.meta?.requestId,
                  arg: {
                    categoryId,
                    page: 1,
                    limit: limit || "10",
                    reset: reset === "true"
                  }
                }
              };
              
              // Dispatch the cached data instead of making the API call
              return store.dispatch(fulfilledAction);
            } else {
              console.log(`⏰ Cache expired for category ${categoryId}, page 1`);
              // Remove expired cache
              await SecureStore.deleteItemAsync(cacheKey);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in productApiMiddleware:", error);
    }
  }

  return next(action);
};

export default productApiMiddleware;