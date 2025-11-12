import { savePushToken1, setLastSavedPushToken } from "./features/authSlice";
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

  if(action.type === 'auth/saveAuthData/fulfilled') {
    console.log("iu7654ewsdfhjhgrdesdfghj765434567890",)
   store.dispatch(savePushToken1() as any);
  }
  console.log("act45689876434567890ion", action.type);
  // if(action.type === 'auth/savePushTokenToStorage/fulfilled') {
  //   const { lastSavedPushToken } = store.getState();
  //   console.log("lastSavedPushToken567890", lastSavedPushToken);
  //   store.dispatch(setLastSavedPushToken(lastSavedPushToken));
  // }
  return result;
};

export default asyncStorageMiddleware;