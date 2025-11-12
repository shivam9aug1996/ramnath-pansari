// src/middleware/handleLogoutMiddleware.js

import { authApi, clearAuthData, savePushToken1, savePushTokenToStorage } from "./features/authSlice";
import { cartApi } from "./features/cartSlice";
import { categoryApi } from "./features/categorySlice";
import { productApi } from "./features/productSlice";

const handleLogoutMiddleware = (store) => (next) => (action) => {
  if (action?.meta?.baseQueryMeta?.response?.url?.includes("logout")) {
    
    store.dispatch(clearAuthData());
  }
  return next(action);
};

export default handleLogoutMiddleware;
