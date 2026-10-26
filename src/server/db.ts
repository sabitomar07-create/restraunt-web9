import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'restaurant.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurant_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      default_address TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('customer', 'admin')),
      created_at TEXT NOT NULL,
      UNIQUE(user_id, role),
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      category_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      image_url TEXT NOT NULL,
      base_price_piastres INTEGER NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_featured INTEGER NOT NULL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 100,
      prep_time_minutes INTEGER DEFAULT 15,
      allergens_en TEXT DEFAULT '',
      allergens_ar TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      price_adjustment_piastres INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_addons (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      price_piastres INTEGER NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      max_quantity INTEGER NOT NULL DEFAULT 3,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS delivery_zones (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      delivery_fee_piastres INTEGER NOT NULL DEFAULT 0,
      min_order_piastres INTEGER NOT NULL DEFAULT 0,
      estimated_minutes INTEGER NOT NULL DEFAULT 35,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value INTEGER NOT NULL,
      min_order_piastres INTEGER DEFAULT 0,
      max_discount_piastres INTEGER,
      usage_limit INTEGER,
      times_used INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT,
      expires_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      title_en TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'special')),
      discount_value INTEGER NOT NULL,
      min_order_piastres INTEGER DEFAULT 0,
      starts_at TEXT,
      ends_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      banner_url TEXT NOT NULL,
      promo_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      idempotency_key TEXT UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
      delivery_zone_id TEXT,
      delivery_address TEXT,
      delivery_notes TEXT,
      subtotal_piastres INTEGER NOT NULL,
      discount_piastres INTEGER NOT NULL DEFAULT 0,
      delivery_fee_piastres INTEGER NOT NULL DEFAULT 0,
      total_piastres INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'cash_on_pickup')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid',
      order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name_en TEXT NOT NULL,
      product_name_ar TEXT NOT NULL,
      variant_name_en TEXT,
      variant_name_ar TEXT,
      addons_summary TEXT,
      unit_price_piastres INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price_piastres INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      changed_by TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  `);

  seedInitialData();
}

// Password hashing helper using standard scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
}

function seedInitialData() {
  const now = new Date().toISOString();

  // 1. Seed Restaurant Settings (configurable placeholder branding)
  const existingSettings = db.prepare('SELECT key FROM restaurant_settings WHERE key = ?').get('branding');
  if (!existingSettings) {
    const defaultBranding = {
      restaurantNameEn: 'YOUR RESTAURANT',
      restaurantNameAr: 'مطعمك',
      taglineEn: 'Authentic Egyptian Street Food & Fresh Sandwiches',
      taglineAr: 'أشهى السندوتشات المصرية الأصيلة والحواوشي البلدي',
      logoUrl: '',
      phone: '+20 100 123 4567',
      whatsapp: '+20 100 123 4567',
      addressEn: '14 Al-Gomhoureya St, Downtown, Cairo, Egypt',
      addressAr: '١٤ شارع الجمهورية، وسط البلد، القاهرة، مصر',
      openingHoursEn: 'Daily: 10:00 AM – 3:00 AM',
      openingHoursAr: 'يومياً: ١٠:٠٠ ص – ٣:٠٠ ص',
      facebookUrl: 'https://facebook.com',
      instagramUrl: 'https://instagram.com',
      isCatalogApproved: false, // Explicitly marked unapproved until owner confirms
      draftNoticeEn: 'Draft catalog & proposed launch prices for review. Not yet final menu.',
      draftNoticeAr: 'قائمة تجريبية وأسعار مقترحة للمراجعة. ليست القائمة النهائية بعد.',
    };

    db.prepare(`
      INSERT INTO restaurant_settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
    `).run('branding', JSON.stringify(defaultBranding), now);
  }

  // 2. Seed Default Delivery Zones
  const countZones = db.prepare('SELECT count(*) as count FROM delivery_zones').get() as { count: number };
  if (countZones.count === 0) {
    const zones = [
      { id: 'zone-downtown', name_en: 'Downtown & Garden City', name_ar: 'وسط البلد وجاردن سيتي', delivery_fee_piastres: 2500, min_order_piastres: 8000, estimated_minutes: 30 },
      { id: 'zone-zamalek', name_en: 'Zamalek & Dokki', name_ar: 'الزمالك والدقي', delivery_fee_piastres: 3000, min_order_piastres: 10000, estimated_minutes: 35 },
      { id: 'zone-heliopolis', name_en: 'Heliopolis & Nasr City', name_ar: 'مصر الجديدة ومدينة نصر', delivery_fee_piastres: 4000, min_order_piastres: 12000, estimated_minutes: 45 },
      { id: 'zone-maadi', name_en: 'Maadi & New Cairo', name_ar: 'المعادي والقاهرة الجديدة', delivery_fee_piastres: 5000, min_order_piastres: 15000, estimated_minutes: 55 },
    ];
    for (const z of zones) {
      db.prepare(`
        INSERT INTO delivery_zones (id, name_en, name_ar, delivery_fee_piastres, min_order_piastres, estimated_minutes, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(z.id, z.name_en, z.name_ar, z.delivery_fee_piastres, z.min_order_piastres, z.estimated_minutes);
    }
  }

  // 3. Seed Admin User (Owner requested temporary dev password "123")
  const adminEmail = 'admin@yourrestaurant.eg';
  const existingAdmin = db.prepare('SELECT id FROM auth_users WHERE email = ?').get(adminEmail) as { id: string } | undefined;
  if (!existingAdmin) {
    const adminId = 'admin-user-001';
    const { hash, salt } = hashPassword('123');
    db.prepare(`
      INSERT INTO auth_users (id, email, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminId, adminEmail, hash, salt, now);

    db.prepare(`
      INSERT INTO profiles (id, email, full_name, phone, default_address, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, adminEmail, 'Restaurant Manager (Admin)', '+20 100 123 4567', 'Cairo Head Office', now, now);

    db.prepare(`
      INSERT INTO user_roles (id, user_id, role, created_at)
      VALUES (?, ?, 'admin', ?)
    `).run('role-admin-001', adminId, now);
  }

  // 4. Seed Categories
  const countCats = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
  if (countCats.count === 0) {
    const categories = [
      { id: 'cat-sandwiches', slug: 'sandwiches', name_en: 'Sandwiches', name_ar: 'السندوتشات', sort_order: 1 },
      { id: 'cat-hawawshi', slug: 'hawawshi', name_en: 'Hawawshi', name_ar: 'الحواوشي', sort_order: 2 },
      { id: 'cat-grills', slug: 'grills', name_en: 'Grills', name_ar: 'المشويات', sort_order: 3 },
      { id: 'cat-meals', slug: 'meals', name_en: 'Egyptian Meals', name_ar: 'الوجبات', sort_order: 4 },
      { id: 'cat-breakfast', slug: 'breakfast', name_en: 'Breakfast', name_ar: 'الفطار', sort_order: 5 },
      { id: 'cat-sides', slug: 'sides', name_en: 'Sides & Extras', name_ar: 'الإضافات والمقبلات', sort_order: 6 },
      { id: 'cat-drinks', slug: 'drinks', name_en: 'Drinks', name_ar: 'المشروبات', sort_order: 7 },
      { id: 'cat-combos', slug: 'combos', name_en: 'Combos & Offers', name_ar: 'العروض والوجبات المجمعة', sort_order: 8 },
    ];
    for (const c of categories) {
      db.prepare(`
        INSERT INTO categories (id, slug, name_en, name_ar, sort_order, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(c.id, c.slug, c.name_en, c.name_ar, c.sort_order, now);
    }
  }

  // 5. Seed Products & Variants & Addons
  const countProducts = db.prepare('SELECT count(*) as count FROM products').get() as { count: number };
  if (countProducts.count === 0) {
    const initialProducts = [
      // 1. Sandwiches
      {
        id: 'p-alex-liver',
        slug: 'alexandrian-liver-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Alexandrian Liver Sandwich',
        name_ar: 'سندوتش كبدة إسكندراني',
        description_en: 'Spicy seasoned beef liver sautéed with green chili peppers, garlic, cumin, and fresh lemon in warm Egyptian fino bread.',
        description_ar: 'كبدة بقري متبلة على أصولها ومشوحة مع الفلفل الأخضر الحامي، الثوم، الكمون وعصير الليمون في عيش فينو طازج.',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 8500, // 85 EGP
        is_featured: 1,
        stock_quantity: 150,
        prep_time_minutes: 10,
        allergens_en: 'Gluten (bread)',
        allergens_ar: 'جلوتين (الخبز)',
        sort_order: 1,
      },
      {
        id: 'p-oriental-sausage',
        slug: 'oriental-sausage-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Oriental Sausage Sandwich',
        name_ar: 'سندوتش سجق شرقي',
        description_en: 'Egyptian oriental sausage cooked with sweet peppers, onions, tomatoes, and aromatic street spices.',
        description_ar: 'سجق شرقي بلدي مطبوخ بخلطة الفلفل الحلو، البصل، الطماطم والتوابل الشرقية الغنية.',
        image_url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 8500, // 85 EGP
        is_featured: 1,
        stock_quantity: 120,
        prep_time_minutes: 12,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 2,
      },
      {
        id: 'p-baladi-sausage',
        slug: 'baladi-sausage-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Baladi Sausage Sandwich',
        name_ar: 'سندوتش سجق بلدي مشوي',
        description_en: 'Fresh minced baladi beef sausage char-grilled with tahini dip in freshly baked Egyptian bread.',
        description_ar: 'سجق لحمة بلدي مفروم طازج ومشوي على الجريل مع سلطة الطحينة في عيش مصري بلدي.',
        image_url: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 8500, // 85 EGP
        is_featured: 0,
        stock_quantity: 90,
        prep_time_minutes: 12,
        allergens_en: 'Gluten, Sesame',
        allergens_ar: 'جلوتين، سمسم',
        sort_order: 3,
      },
      {
        id: 'p-grilled-kofta-sand',
        slug: 'grilled-kofta-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Grilled Kofta Sandwich',
        name_ar: 'سندوتش كفتة مشوية',
        description_en: 'Tender char-grilled seasoned beef kofta skewers topped with fresh parsley, onions, and creamy tahini.',
        description_ar: 'أصابع كفتة لحمة بلدي مشوية على الفحم مع البقدونس الطازج والبصل وسلطة الطحينة.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 11000, // 110 EGP
        is_featured: 1,
        stock_quantity: 100,
        prep_time_minutes: 15,
        allergens_en: 'Gluten, Sesame',
        allergens_ar: 'جلوتين، سمسم',
        sort_order: 4,
      },
      {
        id: 'p-crispy-pane',
        slug: 'crispy-chicken-pane-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Crispy Chicken Sandwich (Pane)',
        name_ar: 'سندوتش بانيه مقرمش',
        description_en: 'Golden crispy marinated chicken breast cutlet with lettuce, pickles, and our signature garlic mayo sauce.',
        description_ar: 'صدر دجاج بانيه متبل ومقرمش بخلطة سرية مع الخس، الخيار المخلل وصوص المايونيز بالثوم الخاص.',
        image_url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 9500, // 95 EGP
        is_featured: 1,
        stock_quantity: 110,
        prep_time_minutes: 12,
        allergens_en: 'Gluten, Eggs',
        allergens_ar: 'جلوتين، بيض',
        sort_order: 5,
      },
      {
        id: 'p-chicken-shawarma',
        slug: 'chicken-shawarma-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Chicken Shawarma Sandwich',
        name_ar: 'سندوتش شاورما فراخ مصري',
        description_en: 'Shredded marinated chicken cooked on spit with tomatoes, parsley, onion sumac, and garlic cream in toasted bread.',
        description_ar: 'شاورما دجاج متبلة ومحمرة مع الطماطم، البقدونس، بصل بالسماق وتومية كريمية في عيش محمص.',
        image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 9500, // 95 EGP
        is_featured: 0,
        stock_quantity: 130,
        prep_time_minutes: 10,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 6,
      },
      {
        id: 'p-taameya-sand',
        slug: 'taameya-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Taameya Sandwich (Egyptian Falafel)',
        name_ar: 'سندوتش طعمية سخنة',
        description_en: 'Crispy green fava-bean patties seasoned with coriander and dill, topped with tahini and fresh tomatoes in baladi bread.',
        description_ar: 'قرص طعمية فريش خضراء بالكزبرة والسمسم، مع سلطة الطحينة والطماطم في عيش بلدي مقمر.',
        image_url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 3500, // 35 EGP
        is_featured: 0,
        stock_quantity: 200,
        prep_time_minutes: 5,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 7,
      },
      {
        id: 'p-foul-sand',
        slug: 'foul-medames-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Foul Medames Sandwich',
        name_ar: 'سندوتش فول مدمس',
        description_en: 'Slow-simmered fava beans mashed with extra virgin olive oil, cumin, lemon, and tahini.',
        description_ar: 'فول مدمس بالزيت الحار أو زيت الزيتون، كمون وليمون مع الطحينة في عيش بلدي ساخن.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 3500, // 35 EGP
        is_featured: 0,
        stock_quantity: 200,
        prep_time_minutes: 5,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 8,
      },
      {
        id: 'p-fried-potato',
        slug: 'fried-potato-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Fried Potato Sandwich',
        name_ar: 'سندوتش بطاطس مقلية مع كاتشب ومايونيز',
        description_en: 'Crispy thick-cut fried Egyptian potatoes seasoned with spices, tahini or ketchup in fino bread.',
        description_ar: 'أصابع بطاطس مقلية مقرمشة مع توابل البطاطس وسلطة الطحينة أو الكاتشب في عيش فينو.',
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 4500, // 45 EGP
        is_featured: 0,
        stock_quantity: 150,
        prep_time_minutes: 7,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 9,
      },
      {
        id: 'p-pastrami-egg',
        slug: 'pastrami-and-egg-sandwich',
        category_id: 'cat-sandwiches',
        name_en: 'Pastrami & Egg Sandwich',
        name_ar: 'سندوتش بسطرمة بالبيض البلدي',
        description_en: 'Scrambled eggs cooked in pure ghee with authentic cured Alexandrian pastrami in freshly baked bread.',
        description_ar: 'بيض بلدي مخفوق ومقلي بالسمنة البلدي مع بسطرمة إسكندراني بلدي في عيش بلدي مقرمش.',
        image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 7500, // 75 EGP
        is_featured: 1,
        stock_quantity: 80,
        prep_time_minutes: 8,
        allergens_en: 'Eggs, Gluten, Dairy',
        allergens_ar: 'بيض، جلوتين، ألبان',
        sort_order: 10,
      },

      // 2. Hawawshi
      {
        id: 'p-hawawshi-classic',
        slug: 'classic-meat-hawawshi',
        category_id: 'cat-hawawshi',
        name_en: 'Classic Meat Hawawshi',
        name_ar: 'حواوشي لحمة بلدي كلاسيك',
        description_en: 'Crispy baked Egyptian baladi bread stuffed with spiced minced beef, onions, green chili, and secret spices.',
        description_ar: 'رغيف عيش بلدي محشو باللحمة المفرومة المتبلة بالبصل، الفلفل الأخضر، والبهارات المصرية ومقرمش في الفرن.',
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 11000, // 110 EGP
        is_featured: 1,
        stock_quantity: 140,
        prep_time_minutes: 18,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 1,
      },
      {
        id: 'p-hawawshi-cheese',
        slug: 'meat-and-cheese-hawawshi',
        category_id: 'cat-hawawshi',
        name_en: 'Meat & Cheese Hawawshi',
        name_ar: 'حواوشي لحمة غرقان جبنة موتزاريلا',
        description_en: 'Our classic spiced beef hawawshi layered with rich melted mozzarella and roumi cheese crust.',
        description_ar: 'حواوشي اللحم البلدي المميز بطبقة سخنة من جبنة الموتزاريلا والجبنة الرومي السايحة.',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 13500, // 135 EGP
        is_featured: 1,
        stock_quantity: 100,
        prep_time_minutes: 20,
        allergens_en: 'Gluten, Dairy',
        allergens_ar: 'جلوتين، ألبان',
        sort_order: 2,
      },
      {
        id: 'p-hawawshi-sausage',
        slug: 'oriental-sausage-hawawshi',
        category_id: 'cat-hawawshi',
        name_en: 'Oriental Sausage Hawawshi',
        name_ar: 'حواوشي سجق شرقي مخصوص',
        description_en: 'Stuffed with succulent oriental sausage, peppers, tomatoes, and Egyptian street spices, baked until golden.',
        description_ar: 'محشو بالسجق الشرقي المتبل مع الفلفل والطماطم ومخبوز حتى القرمشة الذهبية.',
        image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 12500, // 125 EGP
        is_featured: 0,
        stock_quantity: 90,
        prep_time_minutes: 18,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 3,
      },
      {
        id: 'p-hawawshi-spicy-alex',
        slug: 'spicy-alexandrian-hawawshi',
        category_id: 'cat-hawawshi',
        name_en: 'Spicy Alexandrian Hawawshi',
        name_ar: 'حواوشي إسكندراني بالعجين حار',
        description_en: 'Fresh homemade dough filled with spicy minced beef, chili flakes, and black cumin, baked to golden perfection.',
        description_ar: 'عجينة إسكندراني طازجة معجونة ومحشوة بلحم مفروم حامي بفلفل شطة وحبة البركة.',
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 12000, // 120 EGP
        is_featured: 0,
        stock_quantity: 85,
        prep_time_minutes: 22,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 4,
      },
      {
        id: 'p-hawawshi-chicken',
        slug: 'chicken-hawawshi',
        category_id: 'cat-hawawshi',
        name_en: 'Crispy Chicken Hawawshi',
        name_ar: 'حواوشي دجاج متبل',
        description_en: 'Seasoned minced chicken with sweet bell peppers, onions, and herbs baked in crisp Egyptian bread.',
        description_ar: 'صدور دجاج مفرومة ومتبلة بخلطة الأعشاب والفلفل الحلو ومقرمشة في الفرن.',
        image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 10500, // 105 EGP
        is_featured: 0,
        stock_quantity: 75,
        prep_time_minutes: 18,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 5,
      },

      // 3. Grills
      {
        id: 'p-grills-kofta',
        slug: 'char-grilled-kofta-plate',
        category_id: 'cat-grills',
        name_en: 'Charcoal Grilled Kofta Plate',
        name_ar: 'طبق كفتة مشوية على الفحم',
        description_en: 'Half kilo of prime Egyptian baladi beef kofta grilled over charcoal. Served with sesame tahini, pickles, and 3 baladi bread.',
        description_ar: 'نصف كيلو كفتة لحمة بلدي مشوية على الفحم مباشرة، تقدم مع سلطة طحينة، مخلل، و٣ أرغفة عيش بلدي.',
        image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 18000, // 180 EGP
        is_featured: 1,
        stock_quantity: 60,
        prep_time_minutes: 20,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 1,
      },
      {
        id: 'p-grills-tawook',
        slug: 'shish-tawook-platter',
        category_id: 'cat-grills',
        name_en: 'Juicy Shish Tawook Platter',
        name_ar: 'طبق شيش طاووق مشوي بالخلطة',
        description_en: 'Tender marinated chicken breast cubes grilled with onion and bell pepper skewers. Served with garlic dip and fresh fries.',
        description_ar: 'شيش طاووق دجاج طري متبل بالزبادي والليمون والأعشاب، يقدم مع تومية وبطاطس مقلية وعيش.',
        image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 19500, // 195 EGP
        is_featured: 0,
        stock_quantity: 50,
        prep_time_minutes: 20,
        allergens_en: 'Dairy, Gluten',
        allergens_ar: 'ألبان، جلوتين',
        sort_order: 2,
      },
      {
        id: 'p-grills-mixed',
        slug: 'mixed-grill-feast',
        category_id: 'cat-grills',
        name_en: 'Egyptian Mixed Grill Feast',
        name_ar: 'مشكل مشويات بلدي فاخر',
        description_en: 'A combination of charcoal kofta, grilled sausage, and tender shish tawook. Served with yellow basmati rice, tahini, salad, and bread.',
        description_ar: 'تشكيلة فاخرة من الكفتة المشوية، السجق البلدي، والشيش طاووق، مع أرز بسمتي بالخلطة، طحينة، سلطة خضراء وعيش.',
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 28000, // 280 EGP
        is_featured: 1,
        stock_quantity: 40,
        prep_time_minutes: 25,
        allergens_en: 'Sesame, Gluten, Dairy',
        allergens_ar: 'سمسم، جلوتين، ألبان',
        sort_order: 3,
      },

      // 4. Egyptian Meals
      {
        id: 'p-meal-liver',
        slug: 'alexandrian-liver-meal',
        category_id: 'cat-meals',
        name_en: 'Alexandrian Liver Meal',
        name_ar: 'وجبة كبدة إسكندراني كاملة',
        description_en: 'Generous portion of Alexandrian liver with spicy peppers, accompanied by rice or fries, sesame tahini, green salad, and 3 fresh bread.',
        description_ar: 'وجبة كبدة إسكندراني مشوحة، تقدم مع اختيارك من الأرز أو البطاطس، سلطة طحينة، سلطة بلدي، و٣ أرغفة عيش.',
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 14000, // 140 EGP
        is_featured: 0,
        stock_quantity: 70,
        prep_time_minutes: 15,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 1,
      },
      {
        id: 'p-meal-sausage',
        slug: 'oriental-sausage-meal',
        category_id: 'cat-meals',
        name_en: 'Oriental Sausage Meal',
        name_ar: 'وجبة سجق شرقي كاملة',
        description_en: 'Sautéed oriental sausage in rich sauce served with Egyptian rice, pickles, sesame tahini, and bread.',
        description_ar: 'وجبة سجق شرقي بالخلطة الخاصة، تقدم مع أرز مصري بالشعرية، مخلل، طحينة، وعيش.',
        image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 14000, // 140 EGP
        is_featured: 0,
        stock_quantity: 65,
        prep_time_minutes: 15,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 2,
      },

      // 5. Breakfast
      {
        id: 'p-bf-foul-plate',
        slug: 'foul-medames-special-plate',
        category_id: 'cat-breakfast',
        name_en: 'Foul Medames Special Plate',
        name_ar: 'طبق فول بالخلطة والزيت الحار',
        description_en: 'Traditional Egyptian slow-cooked fava beans with linseed oil (zeit harr), cumin, onions, tomatoes, tahini, and warm bread.',
        description_ar: 'طبق فول بلدي بالزيت الحار والليمون والكمون، يعلوه الطحينة والبصل والطماطم، مع ٣ أرغفة عيش.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 4000, // 40 EGP
        is_featured: 0,
        stock_quantity: 120,
        prep_time_minutes: 5,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 1,
      },
      {
        id: 'p-bf-taameya-stuffed',
        slug: 'stuffed-taameya-plate',
        category_id: 'cat-breakfast',
        name_en: 'Stuffed Taameya Plate (4 Pieces)',
        name_ar: 'طبق طعمية محشية بالخلطة (٤ حبات)',
        description_en: 'Four large handmade crispy falafel patties stuffed with spicy onion, chili, and tomato chutney, encrusted in sesame seeds.',
        description_ar: '٤ أقراص طعمية كبيرة محشية بخلطة البصل الحار والشطة والطماطم ومغمورة بالسمسم.',
        image_url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 4000, // 40 EGP
        is_featured: 0,
        stock_quantity: 110,
        prep_time_minutes: 6,
        allergens_en: 'Sesame, Gluten',
        allergens_ar: 'سمسم، جلوتين',
        sort_order: 2,
      },
      {
        id: 'p-bf-pastrami-skillet',
        slug: 'pastrami-egg-skillet',
        category_id: 'cat-breakfast',
        name_en: 'Pastrami & Eggs Ghee Skillet',
        name_ar: 'طاسة بيض بالبسطرمة والسمنة البلدي',
        description_en: 'Three sunny-side or scrambled farm eggs sizzled in Egyptian country ghee with thinly sliced cured pastrami and bread.',
        description_ar: 'طاسة بيض بلدي بالسمنة الفلاحي مع شرائح البسطرمة الإسكندراني وتقدم سخنة مع العيش البلدي.',
        image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 9000, // 90 EGP
        is_featured: 1,
        stock_quantity: 70,
        prep_time_minutes: 10,
        allergens_en: 'Eggs, Dairy, Gluten',
        allergens_ar: 'بيض، ألبان، جلوتين',
        sort_order: 3,
      },

      // 6. Sides & Extras
      {
        id: 'p-side-fries',
        slug: 'golden-french-fries',
        category_id: 'cat-sides',
        name_en: 'Golden French Fries',
        name_ar: 'بطاطس مقلية ذهبية',
        description_en: 'Crisp hot salted French fries seasoned with Egyptian street spices.',
        description_ar: 'بطاطس صوابع مقلية ومقرمشة مع رشة دقة وتوابل خاصة.',
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 5000, // 50 EGP
        is_featured: 0,
        stock_quantity: 300,
        prep_time_minutes: 5,
        allergens_en: '',
        allergens_ar: '',
        sort_order: 1,
      },
      {
        id: 'p-side-tahini',
        slug: 'sesame-tahini-dip',
        category_id: 'cat-sides',
        name_en: 'Creamy Sesame Tahini Dip',
        name_ar: 'سلطة طحينة بالخل والليمون',
        description_en: 'Authentic smooth white sesame tahini blended with garlic, cumin, vinegar, and lemon juice.',
        description_ar: 'طحينة سمسم بيضاء ناعمة بالخل، الليمون، الثوم، وزيت الذرة والكمون.',
        image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 2000, // 20 EGP
        is_featured: 0,
        stock_quantity: 300,
        prep_time_minutes: 2,
        allergens_en: 'Sesame',
        allergens_ar: 'سمسم',
        sort_order: 2,
      },
      {
        id: 'p-side-pickles',
        slug: 'egyptian-mixed-pickles',
        category_id: 'cat-sides',
        name_en: 'Egyptian Mixed Pickles (Mekhalel)',
        name_ar: 'مخلل بلدي مصري مشكل',
        description_en: 'Spiced turnips, carrots, cucumbers, and pickled hot peppers.',
        description_ar: 'طرشي بلدي مشكل (لفت، جزر، خيار، فلفل حار وليمون معصفر).',
        image_url: 'https://images.unsplash.com/photo-1589135233689-d56d2524a984?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 2000, // 20 EGP
        is_featured: 0,
        stock_quantity: 300,
        prep_time_minutes: 1,
        allergens_en: '',
        allergens_ar: '',
        sort_order: 3,
      },
      {
        id: 'p-side-salad',
        slug: 'baladi-green-salad',
        category_id: 'cat-sides',
        name_en: 'Baladi Fresh Green Salad',
        name_ar: 'سلطة خضراء بلدي بالدقة',
        description_en: 'Diced tomatoes, cucumbers, arugula, onion, and fresh parsley tossed in lemon cumin dressing.',
        description_ar: 'طماطم، خيار، جرجير، بقدونس، وبصل أحمر متبلة بالليمون والكمون والشطة.',
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 3000, // 30 EGP
        is_featured: 0,
        stock_quantity: 150,
        prep_time_minutes: 5,
        allergens_en: '',
        allergens_ar: '',
        sort_order: 4,
      },

      // 7. Drinks
      {
        id: 'p-drink-soda',
        slug: 'chilled-soft-drink',
        category_id: 'cat-drinks',
        name_en: 'Chilled Soft Drink (Can 330ml)',
        name_ar: 'مشروب غازي كانز (بيبسي / كولا / سفن)',
        description_en: 'Refreshing ice-cold canned soft drink of your choice.',
        description_ar: 'كانز مثلجة منعشة (بيبسي، كوكاكولا، سفن أب، سبرايت).',
        image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 3000, // 30 EGP
        is_featured: 0,
        stock_quantity: 400,
        prep_time_minutes: 1,
        allergens_en: '',
        allergens_ar: '',
        sort_order: 1,
      },
      {
        id: 'p-drink-water',
        slug: 'mineral-water',
        category_id: 'cat-drinks',
        name_en: 'Mineral Water (600ml)',
        name_ar: 'مياه معدنية طبيعية (٦٠٠ مل)',
        description_en: 'Cold pure bottled spring mineral water.',
        description_ar: 'زجاجة مياه معدنية نقية وباردة.',
        image_url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 1500, // 15 EGP
        is_featured: 0,
        stock_quantity: 500,
        prep_time_minutes: 1,
        allergens_en: '',
        allergens_ar: '',
        sort_order: 2,
      },
      {
        id: 'p-drink-karkadeh',
        slug: 'traditional-cold-hibiscus',
        category_id: 'cat-drinks',
        name_en: 'Aswan Cold Hibiscus (Karkadeh)',
        name_ar: 'كركديه أسواني مثلج طبيعي',
        description_en: 'Freshly brewed tart and sweet red hibiscus flower drink served chilled over ice.',
        description_ar: 'مشروب كركديه أسواني طبيعي معصور ومثلج ومحلى بعناية.',
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 3500, // 35 EGP
        is_featured: 1,
        stock_quantity: 80,
        prep_time_minutes: 2,
        allergens_en: '',
        allergens_ar: '',
        sort_order: 3,
      },

      // 8. Combos
      {
        id: 'p-combo-duo',
        slug: 'cairo-street-duo-combo',
        category_id: 'cat-combos',
        name_en: 'Cairo Street Duo Combo',
        name_ar: 'كومبو شوارع المحروسة (كبدة + سجق)',
        description_en: 'One Alexandrian liver sandwich + one oriental sausage sandwich + French fries + soft drink of your choice.',
        description_ar: 'سندوتش كبدة إسكندراني + سندوتش سجق شرقي + بطاطس مقلية ذهبية + مشروب كانز مثلج.',
        image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 19000, // 190 EGP
        is_featured: 1,
        stock_quantity: 80,
        prep_time_minutes: 12,
        allergens_en: 'Gluten',
        allergens_ar: 'جلوتين',
        sort_order: 1,
      },
      {
        id: 'p-combo-hawawshi-box',
        slug: 'hawawshi-tasting-box',
        category_id: 'cat-combos',
        name_en: 'Hawawshi Trio Feast Box',
        name_ar: 'بوكس ثلاثي الحواوشي الملكي',
        description_en: 'Three whole Hawawshi (Classic Meat + Cheese + Oriental Sausage) served with large fries, two tahini dips, and mixed pickles.',
        description_ar: '٣ أرغفة حواوشي كاملة (لحمة كلاسيك + جبنة موتزاريلا + سجق) مع بطاطس عائلية، ٢ طحينة، وطرشي بلدي.',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
        base_price_piastres: 34000, // 340 EGP
        is_featured: 1,
        stock_quantity: 50,
        prep_time_minutes: 20,
        allergens_en: 'Gluten, Dairy, Sesame',
        allergens_ar: 'جلوتين، ألبان، سمسم',
        sort_order: 2,
      },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, slug, category_id, name_en, name_ar, description_en, description_ar,
        image_url, base_price_piastres, is_available, is_featured, stock_quantity,
        prep_time_minutes, allergens_en, allergens_ar, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of initialProducts) {
      insertProduct.run(
        p.id,
        p.slug,
        p.category_id,
        p.name_en,
        p.name_ar,
        p.description_en,
        p.description_ar,
        p.image_url,
        p.base_price_piastres,
        p.is_featured,
        p.stock_quantity,
        p.prep_time_minutes,
        p.allergens_en,
        p.allergens_ar,
        p.sort_order,
        now,
        now
      );
    }

    // Add Variants to select sandwiches
    const insertVariant = db.prepare(`
      INSERT INTO product_variants (id, product_id, name_en, name_ar, price_adjustment_piastres, is_default, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Liver variants (Regular vs Super Extra Liver)
    insertVariant.run('var-liver-reg', 'p-alex-liver', 'Regular Size (1 Loaf)', 'حجم عادي (رغيف واحد)', 0, 1, 1);
    insertVariant.run('var-liver-double', 'p-alex-liver', 'Double Meat Super Size', 'حجم سوبر زيادة كبدة', 3500, 0, 2);

    // Sausage variants
    insertVariant.run('var-sausage-reg', 'p-oriental-sausage', 'Regular Size', 'حجم عادي', 0, 1, 1);
    insertVariant.run('var-sausage-super', 'p-oriental-sausage', 'Super Loaded', 'حجم سوبر متبل', 3500, 0, 2);

    // Hawawshi variants
    insertVariant.run('var-haw-reg', 'p-hawawshi-classic', 'Single Loaf', 'رغيف واحد كامل', 0, 1, 1);
    insertVariant.run('var-haw-double', 'p-hawawshi-classic', 'Double Stuffed Meat', 'دبل لحمة محشية', 4000, 0, 2);

    // Add Addons (Extras) to items
    const insertAddon = db.prepare(`
      INSERT INTO product_addons (id, product_id, name_en, name_ar, price_piastres, is_available, max_quantity, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `);

    // Global / item specific addons
    insertAddon.run('add-tahini', 'p-alex-liver', 'Extra Sesame Tahini', 'طحينة سمسم إضافية', 1500, 3, 1);
    insertAddon.run('add-hot-peppers', 'p-alex-liver', 'Extra Spicy Green Chili', 'فلفل حامي زيادة', 1000, 2, 2);
    insertAddon.run('add-melted-cheese', 'p-alex-liver', 'Melted Cheddar Cheese', 'جبنة شيدر سايحة', 2500, 2, 3);

    insertAddon.run('add-sau-cheese', 'p-oriental-sausage', 'Melted Mozzarella', 'جبنة موتزاريلا سايحة', 2500, 2, 1);
    insertAddon.run('add-sau-pickles', 'p-oriental-sausage', 'Extra Pickles', 'مخلل إضافي', 1500, 2, 2);

    insertAddon.run('add-haw-cheese', 'p-hawawshi-classic', 'Extra Mozzarella Melt', 'جبنة موتزاريلا إضافية', 3000, 2, 1);
    insertAddon.run('add-haw-tahini', 'p-hawawshi-classic', 'Cup of Tahini', 'كوب طحينة إضافي', 1500, 3, 2);
    insertAddon.run('add-haw-jalapeno', 'p-hawawshi-classic', 'Alexandrian Hot Peppers', 'فلفل إسكندراني حار', 1000, 2, 3);

    insertAddon.run('add-pane-cheese', 'p-crispy-pane', 'Extra Cheddar Slice', 'شريحة شيدر إضافية', 2000, 2, 1);
    insertAddon.run('add-pane-mayo', 'p-crispy-pane', 'Garlic Mayo Dip', 'صوص ثومية مايونيز إضافي', 1500, 2, 2);
  }

  // 6. Seed Active Offers and Promo Codes
  const countOffers = db.prepare('SELECT count(*) as count FROM offers').get() as { count: number };
  if (countOffers.count === 0) {
    const offers = [
      {
        id: 'offer-welcome-15',
        title_en: '15% Off Your First Order',
        title_ar: 'خصم ١٥٪ على طلبك الأول',
        description_en: 'Use promo code CAIRO15 at checkout on orders of EGP 150 or more.',
        description_ar: 'استخدم كود CAIRO15 عند الدفع للطلبات بقيمة ١٥٠ ج.م أو أكثر.',
        discount_type: 'percentage',
        discount_value: 15,
        min_order_piastres: 15000, // 150 EGP
        starts_at: '2026-01-01T00:00:00Z',
        ends_at: '2026-12-31T23:59:59Z',
        banner_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        promo_code: 'CAIRO15',
      },
      {
        id: 'offer-hawawshi-feast',
        title_en: 'Hawawshi Feast Night',
        title_ar: 'سهرة الحواوشي الملكية',
        description_en: 'Save EGP 40 with promo code HAWAWSHI40 on Hawawshi platters over EGP 200.',
        description_ar: 'وفر ٤٠ ج.م باستخدام كود HAWAWSHI40 على طلبات الحواوشي فوق ٢٠٠ ج.م.',
        discount_type: 'fixed',
        discount_value: 4000, // 40 EGP in piastres
        min_order_piastres: 20000, // 200 EGP
        starts_at: '2026-01-01T00:00:00Z',
        ends_at: '2026-12-31T23:59:59Z',
        banner_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
        promo_code: 'HAWAWSHI40',
      },
    ];

    for (const o of offers) {
      db.prepare(`
        INSERT INTO offers (
          id, title_en, title_ar, description_en, description_ar,
          discount_type, discount_value, min_order_piastres, starts_at, ends_at,
          is_active, banner_url, promo_code, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      `).run(
        o.id,
        o.title_en,
        o.title_ar,
        o.description_en,
        o.description_ar,
        o.discount_type,
        o.discount_value,
        o.min_order_piastres,
        o.starts_at,
        o.ends_at,
        o.banner_url,
        o.promo_code,
        now
      );
    }

    // Seed matching promo codes
    db.prepare(`
      INSERT OR IGNORE INTO promo_codes (
        id, code, discount_type, discount_value, min_order_piastres, max_discount_piastres,
        usage_limit, times_used, starts_at, expires_at, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)
    `).run(
      'promo-cairo15',
      'CAIRO15',
      'percentage',
      15,
      15000,
      5000, // max 50 EGP discount
      500,
      '2026-01-01T00:00:00Z',
      '2026-12-31T23:59:59Z',
      now
    );

    db.prepare(`
      INSERT OR IGNORE INTO promo_codes (
        id, code, discount_type, discount_value, min_order_piastres, max_discount_piastres,
        usage_limit, times_used, starts_at, expires_at, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1, ?)
    `).run(
      'promo-hawawshi40',
      'HAWAWSHI40',
      'fixed',
      4000, // 40 EGP
      20000,
      4000,
      300,
      '2026-01-01T00:00:00Z',
      '2026-12-31T23:59:59Z',
      now
    );
  }
}
