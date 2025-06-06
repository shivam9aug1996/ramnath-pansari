import { saveRecentlyViewed } from "./features/recentlyViewedSlice";

// Middleware to save recently viewed items to AsyncStorage
const asyncStorageMiddleware = store => next => action => {
  // First, let the action go through
  const result = next(action);
  
  // If the action affected recentlyViewed state and wasn't a loading or saving action
  if (
    (action.type.startsWith('recentlyViewed/') || 
     action.type === 'recentlyViewed/clearRecentlyViewed') && 
    !action.type.includes('loadItems') && 
    !action.type.includes('saveItems')
  ) {
    // Get the current items and dispatch the save action
    const { recentlyViewed } = store.getState();
   // console.log("recentlyViewed590-", recentlyViewed);
    store.dispatch(saveRecentlyViewed(recentlyViewed.items));
  }
  
  return result;
};

export default asyncStorageMiddleware;