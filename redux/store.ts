import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import addressSlice, { addressApi } from "./features/addressSlice";
import authSlice, { authApi } from "./features/authSlice";
import cartSlice, { cartApi } from "./features/cartSlice";
import categorySlice, { categoryApi } from "./features/categorySlice";
import orderSlice, { orderApi } from "./features/orderSlice";
import productSlice, { productApi } from "./features/productSlice";
import recentSearchSlice, {
  recentSearchApi,
} from "./features/recentSearchSlice";
import searchSlice, { searchApi } from "./features/searchSlice";
import handle401Middleware from "./handle401Middleware";
import handleLogoutMiddleware from "./handleLogoutMiddleware";

const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    category: categorySlice,
    [categoryApi.reducerPath]: categoryApi.reducer,
    product: productSlice,
    [productApi.reducerPath]: productApi.reducer,
    search: searchSlice,
    [searchApi.reducerPath]: searchApi.reducer,
    cart: cartSlice,
    [cartApi.reducerPath]: cartApi.reducer,
    recentSearch: recentSearchSlice,
    [recentSearchApi.reducerPath]: recentSearchApi.reducer,
    address: addressSlice,
    [addressApi.reducerPath]: addressApi.reducer,
    order: orderSlice,
    [orderApi.reducerPath]: orderApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(categoryApi.middleware)
      .concat(productApi.middleware)
      .concat(searchApi.middleware)
      .concat(cartApi.middleware)
      .concat(recentSearchApi.middleware)
      .concat(addressApi.middleware)
      .concat(orderApi.middleware)
      .concat(handle401Middleware)
      .concat(handleLogoutMiddleware),
});

export default store;
setupListeners(store.dispatch);