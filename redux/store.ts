import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import addressSlice, { addressApi } from "./features/addressSlice";
import authSlice, { authApi } from "./features/authSlice";
import cartSlice, { cartApi } from "./features/cartSlice";
import categorySlice, { categoryApi } from "./features/categorySlice";
import khataSlice, { khataApi } from "./features/khataSlice";
import orderSlice, { orderApi } from "./features/orderSlice";
import productSlice, { productApi } from "./features/productSlice";
import searchSlice, { searchApi } from "./features/searchSlice";
import adminOrderSlice, { adminOrderApi } from "./features/adminOrderSlice";
import adminCategorySlice, { adminCategoryApi } from "./features/adminCategorySlice";
import adminProductSlice, { adminProductApi } from "./features/adminProductSlice";
import adminUserSlice, { adminUserApi } from "./features/adminUserSlice";
import adminOfferSlice, { adminOfferApi } from "./features/adminOfferSlice";
import adminCarouselSlice, { adminCarouselApi } from "./features/adminCarouselSlice";
import offerSlice, { offerApi } from "./features/offerSlice";
import carouselSlice, { carouselApi } from "./features/carouselSlice";
import deliverySettingsSlice, { deliverySettingsApi } from "./features/deliverySettingsSlice";
import adminDeliverySettingsSlice, { adminDeliverySettingsApi } from "./features/adminDeliverySettingsSlice";
import storeConfigSlice, { storeConfigApi } from "./features/storeConfigSlice";
import adminStoreConfigSlice, { adminStoreConfigApi } from "./features/adminStoreConfigSlice";
import adminSyncVersionsSlice, { adminSyncVersionsApi } from "./features/adminSyncVersionsSlice";
import recentSearchSlice, {
  recentSearchApi,
} from "./features/recentSearchSlice";
import recentlyViewedSlice from "./features/recentlyViewedSlice";
import appSyncSlice from "./features/appSyncSlice";
import driverOrderSlice, { driverOrderApi } from "./features/driverOrderSlice";
import handle401Middleware from "./handle401Middleware";
import handleLogoutMiddleware from "./handleLogoutMiddleware";
import asyncStorageMiddleware from "./asyncStorageMiddleware";
import weatherSlice from "./features/weatherSlice";
import productApiMiddleware from "./productApiMiddleware";

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
    adminOrder: adminOrderSlice,
    [adminOrderApi.reducerPath]: adminOrderApi.reducer,
    adminCategory: adminCategorySlice,
    [adminCategoryApi.reducerPath]: adminCategoryApi.reducer,
    adminProduct: adminProductSlice,
    [adminProductApi.reducerPath]: adminProductApi.reducer,
    adminUser: adminUserSlice,
    [adminUserApi.reducerPath]: adminUserApi.reducer,
    adminOffer: adminOfferSlice,
    [adminOfferApi.reducerPath]: adminOfferApi.reducer,
    adminCarousel: adminCarouselSlice,
    [adminCarouselApi.reducerPath]: adminCarouselApi.reducer,
    offer: offerSlice,
    [offerApi.reducerPath]: offerApi.reducer,
    carousel: carouselSlice,
    [carouselApi.reducerPath]: carouselApi.reducer,
    deliverySettings: deliverySettingsSlice,
    [deliverySettingsApi.reducerPath]: deliverySettingsApi.reducer,
    adminDeliverySettings: adminDeliverySettingsSlice,
    [adminDeliverySettingsApi.reducerPath]: adminDeliverySettingsApi.reducer,
    storeConfig: storeConfigSlice,
    [storeConfigApi.reducerPath]: storeConfigApi.reducer,
    adminStoreConfig: adminStoreConfigSlice,
    [adminStoreConfigApi.reducerPath]: adminStoreConfigApi.reducer,
    adminSyncVersions: adminSyncVersionsSlice,
    [adminSyncVersionsApi.reducerPath]: adminSyncVersionsApi.reducer,
    khata: khataSlice,
    [khataApi.reducerPath]: khataApi.reducer,
    recentlyViewed: recentlyViewedSlice,
    weather: weatherSlice,
    appSync: appSyncSlice,
    driverOrder: driverOrderSlice,
    [driverOrderApi.reducerPath]: driverOrderApi.reducer,
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
      .concat(adminOrderApi.middleware)
      .concat(adminCategoryApi.middleware)
      .concat(adminProductApi.middleware)
      .concat(adminUserApi.middleware)
      .concat(adminOfferApi.middleware)
      .concat(adminCarouselApi.middleware)
      .concat(offerApi.middleware)
      .concat(carouselApi.middleware)
      .concat(deliverySettingsApi.middleware)
      .concat(adminDeliverySettingsApi.middleware)
      .concat(storeConfigApi.middleware)
      .concat(adminStoreConfigApi.middleware)
      .concat(adminSyncVersionsApi.middleware)
      .concat(driverOrderApi.middleware)
      .concat(khataApi.middleware)
      .concat(asyncStorageMiddleware)
      .concat(handle401Middleware)
      //.concat(handleLogoutMiddleware),
});

export default store;
setupListeners(store.dispatch);
