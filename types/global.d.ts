export interface OnboardingSlide {
  key: number;
  backgroundColor: string;
  image: any;
  title: string;
  text: string;
}

export interface ProgressBarProps {
  activeIndex: number;
}

export interface FontStyles {
  fontWeight: TextStyle["fontWeight"];
  fontSize: number;
  fontFamily: string | undefined;
}

export interface FontsInterface {
  defaultRegular: FontStyles;
  defaultSemiBold: FontStyles;
  defaultMedium: FontStyles;
  defaultExtraBold: FontStyles;
  defaultBold: FontStyles;
}

export interface AuthState {
  token: string | null;
  userData: UserData | null;
  lastSavedPushToken?: string | null;
  saveAuthData: AsyncState<any>;
  loadAuthData: AsyncState<any>;
  clearAuthData: AsyncState<any>;
  logoutSessionPending?: boolean;
  successModalOnAccountCreation: boolean;
  userAlreadyRegistered?: boolean;
}

interface UserData {
  userId: string | null;
  mobileNumber: string | null;
  _id: string;
  name: string | null;
  profileImage?: null;
  isAdminUser?: boolean;
  isGuestUser?: boolean;
  isDriverUser?: boolean;
  driverId?: string;
}

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: any | null;
  isSuccess: boolean;
}

interface RootState {
  auth: AuthState;
  appSync: {
    ready: boolean;
    inProgress: boolean;
    lastSyncedAt: number | null;
    fetch: AppSyncFetchFlags | null;
  };
  product: {
    selectedSubCategoryId: {
      _id: string;
    };
    productListPosition: number;
  };
  cart: {
    cartButtonProductId: string[];
  };
}

export interface AuthData {
  token: string | null;
  userData: string | null;
}

export interface OnboardingItemProps {
  handlePress: () => void;
  item: OnboardingSlide;
  activeSlide: number;
  isLoadingVerifyOtp: boolean;
}

export interface SaveAuthDataPayload {
  token: string;
  userData: any; // Adjust this type as per your actual data structure
}

export interface Category {
  _id: string;
  name: string;
  image: string | null;
  children: Category[];
}

export interface SubCategory {
  _id: string;
  name: string;
}

export interface CategoryListProps {
  categories: Category[];
  isCategoryFetching: boolean;
  selectedCategoryIdIndex?: number;
}

export interface CategorySelectorProps {
  categories: Category[];
  selectedCategory?: Category | null;
  onSelectCategory: (category: Category) => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
  variant?: "small" | "large";
}

export interface SubCategorySelectorProps {
  subCategories: SubCategory[];
  selectedSubCategory: SubCategory | null;
  onSelectSubCategory: (subCategory: SubCategory) => void;
  subCatFlatListRef: any;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export interface Product {
  _id: string;
  name: string;
  categoryPath: string[];
  image: string | null;
  discountedPrice: number;
  price: number;
  size?: string;
  category?: string;
  isOutOfStock: boolean;
  maxQuantity?: number;
  brand?: string;
  countryOfOrigin?: string;
  articleId?: string;
  foodType?: "veg" | "non-veg";
}

export interface ProductDetailInformation {
  brand: string | null;
  countryOfOrigin: string | null;
  articleId: string | null;
  vegNonVeg: string | null;
}

export interface ProductDetailSpecifications {
  netQuantity: string | null;
  productType: string | null;
}

export interface ProductDetailResponse {
  product: Product | null;
  productInformation?: ProductDetailInformation;
  itemSpecifications?: ProductDetailSpecifications;
  images?: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface ProductItemProps {
  item: Product;
  index: number;
  cartItem?: CartItem;
  isCartLoading: boolean;
  isProductsFetching: boolean;
  paginationState: { page: number };
}

export interface CartButtonProps {
  value: number;
  item: Product;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export interface ProductDetails {
  name: string;
  image?: string;
  discountedPrice: number;
}

export interface CartItem {
  _id?: string;
  productId?: string;
  productDetails: ProductDetails & Partial<Product>;
  quantity: number;
  isPromoFreebie?: boolean;
  offerId?: string;
  promoPrice?: number;
}

export interface CartItemProps {
  item: CartItem;
  order?: boolean;
}

// Admin Orders Types
export interface AdminOrderTransactionData {
  method: string; // e.g., "COD", "ONLINE"
  createdAt: string | Date;
  currency: string; // e.g., "INR"
  isLive: boolean;
  amount: string; // keep as string to match backend
}

export interface AdminOrderProductDetails {
  _id: string;
  name: string;
  categoryPath: string[];
  image?: string | null;
  discountedPrice: number;
  price: number;
  size?: string;
  category?: string;
  lastUpdated?: string;
}

export interface AdminOrderCartItem {
  productId: string;
  quantity: number;
  productDetails: AdminOrderProductDetails;
}

export interface AdminOrderCartData {
  cart: {
    _id?: string;
    userId?: string;
    items: AdminOrderCartItem[];
  };
}

export interface AdminOrderAddressData {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
  mapImage?: string | null;
}

export type AdminOrderStatus =
  | "created"
  | "confirmed"
  | "out_for_delivery"
  | "delivered"
  | "canceled";

export interface AdminOrderHistoryItem {
  status: AdminOrderStatus | string;
  timestamp: string | Date;
}

export interface AdminOrderDocument {
  _id: string;
  transactionData: AdminOrderTransactionData;
  cartData: AdminOrderCartData;
  addressData: AdminOrderAddressData;
  orderStatus: AdminOrderStatus | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  orderId: string;
  userId: string;
  imgArr?: string[];
  productCount?: number;
  totalProductCount?: number;
  orderHistory?: AdminOrderHistoryItem[];
  amountPaid?: string;
  subtotal?: number;
  deliveryFee?: number;
  assignedDriver?: {
    driverId: string;
    driverUserId?: string;
    name: string;
    phone: string;
    assignedAt?: string;
  } | null;
  driverTrackingStatus?: string | null;
}

export interface AdminOrderListResponse {
  orders: AdminOrderDocument[];
  currentPage?: number;
  totalPages?: number;
}

export interface AdminStatsResponse {
  total: number;
  today: number;
  byStatus: {
    confirmed: number;
    out_for_delivery: number;
    delivered: number;
    canceled: number;
  };
  products: {
    total: number;
    inStock: number;
    outOfStock: number;
    promoOnly: number;
  };
  categories: {
    total: number;
    root: number;
    leaf: number;
  };
  users: {
    total: number;
    admins: number;
    customers: number;
    guests: number;
  };
}

export interface AdminUserDocument {
  _id: string;
  mobileNumber: string;
  name: string | null;
  khataUrl: string | null;
  profileImage: unknown;
  isAdminUser: boolean;
  isGuestUser: boolean;
  isDriverUser: boolean;
  driverId?: string;
  orderCount?: number;
  createdAt?: string;
}

export interface AdminUserListResponse {
  users: AdminUserDocument[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface AdminUserInput {
  mobileNumber: string;
  password: string;
  name?: string;
  isAdminUser?: boolean;
  isDriverUser?: boolean;
}

export interface AdminUserUpdateInput {
  name?: string;
  khataUrl?: string | null;
  isAdminUser?: boolean;
  isDriverUser?: boolean;
  password?: string;
}

export interface DriverOrderSummary {
  _id: string;
  orderId: string;
  orderStatus: string;
  driverTrackingStatus?: string | null;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number | null;
  longitude: number | null;
  amountPaid?: string;
  totalProductCount?: number;
  itemCount: number;
  imgArr: string[];
  assignedDriver?: {
    driverId: string;
    name: string;
    phone: string;
    assignedAt?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriverOrdersResponse {
  orders: DriverOrderSummary[];
  activeDeliveryOrderId: string | null;
  driverId: string;
}

export interface AdminDriverOption {
  _id: string;
  driverId: string;
  name: string;
  mobileNumber: string;
}

export interface AdminCategoryListResponse {
  categories: Category[];
}

export interface AdminCategoryDetailResponse {
  category: Category;
  parentId: string | null;
  breadcrumb: { _id: string; name: string }[];
}

export interface AdminCategoryInput {
  name: string;
  image?: string | null;
  parentCategoryId?: string;
}

export interface AdminProductDocument {
  _id: string;
  name: string;
  categoryPath: string[];
  image: string | null;
  price: number;
  discountedPrice: number;
  size: string;
  category?: string;
  maxQuantity?: number;
  isOutOfStock: boolean;
  brand?: string;
  foodType?: "veg" | "non-veg";
  skuCode?: string;
  jiomartUid?: string;
  promoOnly?: boolean;
  productFromJio?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  lastUpdated?: string;
}

export interface AdminProductListResponse {
  products: AdminProductDocument[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface AdminProductInput {
  name: string;
  categoryPath: string[];
  price: number;
  discountedPrice: number;
  size: string;
  image?: string | null;
  maxQuantity?: number;
  isOutOfStock?: boolean;
  brand?: string;
  foodType?: "veg" | "non-veg";
  category?: string;
  promoOnly?: boolean;
}

export interface LiveOfferProductUsage {
  offerId: string;
  minOrderValue: number;
  promoPrice: number;
  quantity: number;
}

export interface ProductOfferUsage {
  inLiveOffer: boolean;
  liveOffers: LiveOfferProductUsage[];
  canDelete: boolean;
  blockedFields: ("promoOnly" | "delete")[];
  safeToEdit: string[];
  blockedEdits: { field: string; reason: string }[];
  notes: string[];
}

export interface JiomartSyncCategory {
  name: string;
  syncAvailable: boolean;
  vertex?: {
    l1Category: string;
    l2Category: string;
    l3Category: string;
  };
  productCount: number;
  storeCategoryFound: boolean;
}

export interface JiomartSyncListResponse {
  total: number;
  syncAvailableCount: number;
  categories: JiomartSyncCategory[];
}

export interface JiomartSyncResultItem {
  category: string;
  syncedProducts?: number;
  totalProducts?: number;
  error?: string;
}

export interface JiomartSyncResponse {
  message: string;
  wipeAll: boolean;
  requested: string[];
  summary: {
    requested: number;
    succeeded: number;
    failed: number;
  };
  results: JiomartSyncResultItem[];
}

export type OfferRewardType = "freebie" | "discount";

export interface FreebieReward {
  productId: string;
  quantity: number;
  promoPrice?: number;
  label?: string;
  productSnapshot?: Pick<
    Product,
    "_id" | "name" | "image" | "price" | "size" | "discountedPrice"
  >;
}

export interface DiscountReward {
  kind: "flat" | "percent";
  value: number;
  maxDiscount?: number;
  label?: string;
}

export interface OfferDocument {
  id: string;
  enabled: boolean;
  type: OfferRewardType;
  minOrderValue: number;
  sortOrder: number;
  freebies?: FreebieReward[];
  discount?: DiscountReward;
  createdAt: string;
  updatedAt: string;
}

export interface OffersResponse {
  offers: OfferDocument[];
}

export type AdminOfferDocument = OfferDocument;

export type AdminOfferInput = Omit<
  OfferDocument,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export interface AdminOfferListResponse {
  offers: AdminOfferDocument[];
}

export type CarouselActionType = "none" | "scroll_categories" | "category";

export interface CarouselBannerDocument {
  id: string;
  enabled: boolean;
  sortOrder: number;
  imageUrl: string;
  blurhash?: string;
  actionType: CarouselActionType;
  categoryId?: string;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarouselResponse {
  banners: CarouselBannerDocument[];
}

export type AdminCarouselDocument = CarouselBannerDocument;

export type AdminCarouselInput = Omit<
  CarouselBannerDocument,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

export interface AdminCarouselListResponse {
  banners: AdminCarouselDocument[];
}

export interface DeliverySettingsDocument {
  freeDeliveryMin: number;
  shippingFee: number;
}

export interface DeliverySettingsResponse {
  deliverySettings: DeliverySettingsDocument;
}

export type AdminDeliverySettingsResponse = DeliverySettingsResponse;

export interface StoreHoursDocument {
  openTime: string;
  closeTime: string;
  timezone: string;
}

export interface DeliveryRadiusDocument {
  radiusKm: number;
  centerLatitude: number;
  centerLongitude: number;
}

export interface StoreConfigDocument {
  acceptingOrders?: boolean;
  storeHours: StoreHoursDocument;
  deliveryRadius: DeliveryRadiusDocument;
}

export interface StoreConfigResponse {
  storeConfig: StoreConfigDocument;
}

export type AdminStoreConfigResponse = StoreConfigResponse;

export type AppSyncServerVersions = {
  carousel: number;
  offers: number;
  deliverySettings: number;
  storeConfig: number;
  category: number;
  product: number;
};

export type AppSyncClientVersions = Partial<AppSyncServerVersions>;

export type AppSyncFetchFlags = {
  carousel: boolean;
  offers: boolean;
  deliverySettings: boolean;
  storeConfig: boolean;
  category: boolean;
  product: boolean;
};

export type AppSyncResponse = {
  server: AppSyncServerVersions;
  fetch: AppSyncFetchFlags;
};

export type AdminSyncVersionsResponse = {
  syncVersions: AppSyncServerVersions;
};
