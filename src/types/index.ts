export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  sort_order: number;
  is_active: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name_en: string;
  name_ar: string;
  price_adjustment_piastres: number;
  is_default: number;
  sort_order: number;
}

export interface ProductAddon {
  id: string;
  product_id?: string;
  name_en: string;
  name_ar: string;
  price_piastres: number;
  is_available: number;
  max_quantity: number;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  base_price_piastres: number;
  is_available: number;
  is_featured: number;
  stock_quantity: number;
  prep_time_minutes: number;
  allergens_en?: string;
  allergens_ar?: string;
  sort_order: number;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
}

export interface DeliveryZone {
  id: string;
  name_en: string;
  name_ar: string;
  delivery_fee_piastres: number;
  min_order_piastres: number;
  estimated_minutes: number;
  is_active: number;
}

export interface Offer {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  discount_type: 'percentage' | 'fixed' | 'special';
  discount_value: number;
  min_order_piastres: number;
  starts_at?: string;
  ends_at?: string;
  is_active: number;
  banner_url: string;
  promo_code?: string;
}

export interface RestaurantBranding {
  restaurantNameEn: string;
  restaurantNameAr: string;
  taglineEn: string;
  taglineAr: string;
  logoUrl?: string;
  phone: string;
  whatsapp: string;
  addressEn: string;
  addressAr: string;
  openingHoursEn: string;
  openingHoursAr: string;
  facebookUrl?: string;
  instagramUrl?: string;
  isCatalogApproved: boolean;
  draftNoticeEn: string;
  draftNoticeAr: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  defaultAddress?: string;
  role: 'customer' | 'admin';
}

export interface SelectedAddon {
  id: string;
  nameEn: string;
  nameAr: string;
  pricePiastres: number;
  quantity: number;
}

export interface CartItem {
  id: string; // unique key in cart
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  addons: SelectedAddon[];
  notes?: string;
  quantity: number;
  unitPricePiastres: number;
  totalPricePiastres: number;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_id: string;
  product_name_en: string;
  product_name_ar: string;
  variant_name_en?: string;
  variant_name_ar?: string;
  addons_summary?: string;
  unit_price_piastres: number;
  quantity: number;
  total_price_piastres: number;
  notes?: string;
}

export interface OrderStatusHistoryRecord {
  id: string;
  order_id: string;
  status: string;
  notes?: string;
  changed_by?: string;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_phone: string;
  order_type: 'delivery' | 'pickup';
  delivery_zone_id?: string;
  delivery_address?: string;
  delivery_notes?: string;
  subtotal_piastres: number;
  discount_piastres: number;
  delivery_fee_piastres: number;
  total_piastres: number;
  payment_method: 'cash_on_delivery' | 'cash_on_pickup';
  payment_status: string;
  order_status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  items?: OrderItemRecord[];
  history?: OrderStatusHistoryRecord[];
  deliveryZone?: DeliveryZone;
}
