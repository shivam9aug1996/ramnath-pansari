// src/middleware/handleLogoutMiddleware.js

import { authApi, clearAuthData } from "./features/authSlice";
import { cartApi } from "./features/cartSlice";
import { categoryApi } from "./features/categorySlice";
import { productApi } from "./features/productSlice";

const handleLogoutMiddleware = (store) => (next) => (action) => {
  // console.log("o987654ertyuikl", JSON.stringify(action));
  // Check if the action has an error with status 401
 // console.log("gfdcvkjhgf", JSON.stringify(action));
  if (action?.meta?.baseQueryMeta?.response?.url?.includes("logout")) {
    //console.log("logout9876567890");
    store.dispatch(clearAuthData());
    // store.dispatch(productApi.util.resetApiState());
    // store.dispatch(categoryApi.util.resetApiState());
    // store.dispatch(cartApi.util.resetApiState());
  }
  return next(action);
};

export default handleLogoutMiddleware;
