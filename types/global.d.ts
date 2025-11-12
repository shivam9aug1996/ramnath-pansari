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
  saveAuthData: AsyncState<any>;
  loadAuthData: AsyncState<any>;
  clearAuthData: AsyncState<any>;
  successModalOnAccountCreation: boolean;
}

interface UserData {
  userId: string | null;
  mobileNumber: string | null;
  _id: string;
  name: string | null;
  profileImage?: null;
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
  isOutOfStock: boolean;
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
  productDetails: ProductDetails;
  quantity: number;
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
}

export interface AdminOrderListResponse {
  orders: AdminOrderDocument[];
  currentPage?: number;
  totalPages?: number;
}
