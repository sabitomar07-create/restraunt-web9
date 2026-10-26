import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword } from './db.ts';
import {
  AuthenticatedUser,
  AuthRequest,
  createSession,
  optionalAuthMiddleware,
  requireAuth,
  requireAdmin,
} from './auth.ts';
import {
  calculateOrderTotals,
  validatePromoCode,
  ItemPricingInput,
  PromoCodeInput,
  DeliveryZoneInput,
} from './rules.ts';

export const apiRouter = Router();

// Apply session parsing to all API requests
apiRouter.use(optionalAuthMiddleware);

// ==========================================
// 1. BRANDING & SETTINGS
// ==========================================

apiRouter.get('/settings', (_req: Request, res: Response) => {
  const row = db.prepare('SELECT value_json FROM restaurant_settings WHERE key = ?').get('branding') as
    | { value_json: string }
    | undefined;

  if (!row) {
    res.json({});
    return;
  }
  res.json(JSON.parse(row.value_json));
});

apiRouter.put('/admin/settings', requireAdmin, (req: Request, res: Response) => {
  const branding = req.body;
  if (!branding || typeof branding !== 'object') {
    res.status(400).json({ error: 'Invalid settings payload.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO restaurant_settings (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run('branding', JSON.stringify(branding), now);

  res.json({ success: true, settings: branding });
});

// Admin change password
apiRouter.put('/admin/change-password', requireAdmin, (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 3) {
    res.status(400).json({ error: 'New password must be at least 3 characters long.' });
    return;
  }

  const user = db.prepare('SELECT password_hash, salt FROM auth_users WHERE id = ?').get(req.user!.id) as {
    password_hash: string;
    salt: string;
  };

  if (!verifyPassword(currentPassword, user.password_hash, user.salt)) {
    res.status(400).json({ error: 'Incorrect current password.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE auth_users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, req.user!.id);

  res.json({ success: true, message: 'Password updated successfully.' });
});

// ==========================================
// 2. AUTHENTICATION & PROFILES
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, password, fullName, phone, defaultAddress } = req.body;

  if (!email || !password || !fullName) {
    res.status(400).json({ error: 'Email, password, and full name are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM auth_users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(400).json({ error: 'An account with this email already exists.' });
    return;
  }

  const userId = 'usr-' + crypto.randomUUID();
  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(password);

  db.prepare(`
    INSERT INTO auth_users (id, email, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, cleanEmail, hash, salt, now);

  db.prepare(`
    INSERT INTO profiles (id, email, full_name, phone, default_address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, cleanEmail, String(fullName).trim(), phone || null, defaultAddress || null, now, now);

  // New signups ALWAYS get customer role (strictly non-admin)
  db.prepare(`
    INSERT INTO user_roles (id, user_id, role, created_at)
    VALUES (?, ?, 'customer', ?)
  `).run('role-' + crypto.randomUUID(), userId, now);

  const token = createSession(userId);

  res.status(201).json({
    user: {
      id: userId,
      email: cleanEmail,
      fullName: String(fullName).trim(),
      phone: phone || undefined,
      defaultAddress: defaultAddress || undefined,
      role: 'customer',
    },
    token,
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare(`
    SELECT u.id, u.password_hash, u.salt, p.email, p.full_name, p.phone, p.default_address, r.role
    FROM auth_users u
    JOIN profiles p ON p.id = u.id
    LEFT JOIN user_roles r ON r.user_id = u.id
    WHERE u.email = ?
  `).get(cleanEmail) as {
    id: string;
    password_hash: string;
    salt: string;
    email: string;
    full_name: string;
    phone?: string;
    default_address?: string;
    role?: 'customer' | 'admin';
  } | undefined;

  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = createSession(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone || undefined,
      defaultAddress: user.default_address || undefined,
      role: user.role || 'customer',
    },
    token,
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

apiRouter.put('/auth/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const { fullName, phone, defaultAddress } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE profiles
    SET full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        default_address = COALESCE(?, default_address),
        updated_at = ?
    WHERE id = ?
  `).run(fullName || null, phone || null, defaultAddress || null, now, req.user!.id);

  const updatedProfile = db.prepare(`
    SELECT p.id, p.email, p.full_name, p.phone, p.default_address, r.role
    FROM profiles p
    LEFT JOIN user_roles r ON r.user_id = p.id
    WHERE p.id = ?
  `).get(req.user!.id) as {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    default_address?: string;
    role?: 'customer' | 'admin';
  };

  res.json({
    user: {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.full_name,
      phone: updatedProfile.phone || undefined,
      defaultAddress: updatedProfile.default_address || undefined,
      role: updatedProfile.role || 'customer',
    },
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ success: true });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT id FROM auth_users WHERE email = ?').get(cleanEmail) as { id: string } | undefined;

  // Protect privacy by returning generic success even if user not found
  if (!user) {
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    });
    return;
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO password_resets (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(resetToken, user.id, expiresAt, now);

  res.json({
    success: true,
    message: 'Password reset token generated. In production, this is sent via email.',
    resetToken, // Provided in development environment for verification
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 3) {
    res.status(400).json({ error: 'Valid reset token and new password (min 3 chars) are required.' });
    return;
  }

  const resetRow = db.prepare('SELECT user_id, expires_at FROM password_resets WHERE token = ?').get(token) as
    | { user_id: string; expires_at: string }
    | undefined;

  if (!resetRow) {
    res.status(400).json({ error: 'Invalid or expired password reset token.' });
    return;
  }

  if (new Date(resetRow.expires_at) < new Date()) {
    db.prepare('DELETE FROM password_resets WHERE token = ?').run(token);
    res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  db.prepare('UPDATE auth_users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, resetRow.user_id);
  db.prepare('DELETE FROM password_resets WHERE token = ?').run(token);
  // Invalidate any existing sessions
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(resetRow.user_id);

  res.json({ success: true, message: 'Password has been reset successfully. Please sign in.' });
});

// ==========================================
// 3. CATEGORIES & PRODUCTS
// ==========================================

apiRouter.get('/categories', (_req: Request, res: Response) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  res.json(categories);
});

apiRouter.get('/products', (req: Request, res: Response) => {
  const { category, search, featured } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  // Public callers only see available products unless admin
  // (We return all products with is_available flag so UI can display "Sold Out" badge accurately)
  if (category) {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(String(category)) as { id: string } | undefined;
    if (cat) {
      query += ' AND category_id = ?';
      params.push(cat.id);
    }
  }

  if (featured === '1' || featured === 'true') {
    query += ' AND is_featured = 1';
  }

  if (search) {
    query += ' AND (name_en LIKE ? OR name_ar LIKE ? OR description_en LIKE ? OR description_ar LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY sort_order ASC, name_en ASC';

  const products = db.prepare(query).all(...params) as any[];

  // Attach variants and addons
  const allVariants = db.prepare('SELECT * FROM product_variants ORDER BY sort_order ASC').all() as any[];
  const allAddons = db.prepare('SELECT * FROM product_addons ORDER BY sort_order ASC').all() as any[];

  const enriched = products.map((p) => ({
    ...p,
    variants: allVariants.filter((v) => v.product_id === p.id),
    addons: allAddons.filter((a) => a.product_id === p.id || !a.product_id),
  }));

  res.json(enriched);
});

apiRouter.get('/products/:slug', (req: Request, res: Response) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug) as any;
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC').all(product.id);
  const addons = db.prepare('SELECT * FROM product_addons WHERE product_id = ? OR product_id IS NULL ORDER BY sort_order ASC').all(product.id);
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(product.category_id);

  res.json({
    ...product,
    category,
    variants,
    addons,
  });
});

// Admin Product CRUD
apiRouter.post('/admin/products', requireAdmin, (req: Request, res: Response) => {
  const {
    categoryId,
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    imageUrl,
    basePricePiastres,
    isAvailable,
    isFeatured,
    stockQuantity,
    prepTimeMinutes,
    allergensEn,
    allergensAr,
    variants = [],
    addons = [],
  } = req.body;

  if (!nameEn || !nameAr || basePricePiastres === undefined || !categoryId) {
    res.status(400).json({ error: 'Name (EN/AR), Category, and Price are required.' });
    return;
  }

  const id = 'prod-' + crypto.randomUUID();
  const slug =
    nameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Date.now().toString().slice(-4);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products (
      id, slug, category_id, name_en, name_ar, description_en, description_ar,
      image_url, base_price_piastres, is_available, is_featured, stock_quantity,
      prep_time_minutes, allergens_en, allergens_ar, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99, ?, ?)
  `).run(
    id,
    slug,
    categoryId,
    nameEn,
    nameAr,
    descriptionEn || '',
    descriptionAr || '',
    imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    Math.max(0, parseInt(basePricePiastres, 10)),
    isAvailable !== false ? 1 : 0,
    isFeatured ? 1 : 0,
    parseInt(stockQuantity || 100, 10),
    parseInt(prepTimeMinutes || 15, 10),
    allergensEn || '',
    allergensAr || '',
    now,
    now
  );

  // Insert variants
  for (const v of variants) {
    db.prepare(`
      INSERT INTO product_variants (id, product_id, name_en, name_ar, price_adjustment_piastres, is_default, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run('var-' + crypto.randomUUID(), id, v.nameEn, v.nameAr, v.priceAdjustmentPiastres || 0, v.isDefault ? 1 : 0);
  }

  // Insert addons
  for (const a of addons) {
    db.prepare(`
      INSERT INTO product_addons (id, product_id, name_en, name_ar, price_piastres, is_available, max_quantity, sort_order)
      VALUES (?, ?, ?, ?, ?, 1, 3, 0)
    `).run('add-' + crypto.randomUUID(), id, a.nameEn, a.nameAr, a.pricePiastres || 0);
  }

  res.status(201).json({ id, slug, success: true });
});

apiRouter.put('/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const p = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products
    SET name_en = COALESCE(?, name_en),
        name_ar = COALESCE(?, name_ar),
        description_en = COALESCE(?, description_en),
        description_ar = COALESCE(?, description_ar),
        image_url = COALESCE(?, image_url),
        base_price_piastres = COALESCE(?, base_price_piastres),
        category_id = COALESCE(?, category_id),
        is_available = COALESCE(?, is_available),
        is_featured = COALESCE(?, is_featured),
        stock_quantity = COALESCE(?, stock_quantity),
        prep_time_minutes = COALESCE(?, prep_time_minutes),
        allergens_en = COALESCE(?, allergens_en),
        allergens_ar = COALESCE(?, allergens_ar),
        updated_at = ?
    WHERE id = ?
  `).run(
    p.nameEn || null,
    p.nameAr || null,
    p.descriptionEn ?? null,
    p.descriptionAr ?? null,
    p.imageUrl || null,
    p.basePricePiastres !== undefined ? parseInt(p.basePricePiastres, 10) : null,
    p.categoryId || null,
    p.isAvailable !== undefined ? (p.isAvailable ? 1 : 0) : null,
    p.isFeatured !== undefined ? (p.isFeatured ? 1 : 0) : null,
    p.stockQuantity !== undefined ? parseInt(p.stockQuantity, 10) : null,
    p.prepTimeMinutes !== undefined ? parseInt(p.prepTimeMinutes, 10) : null,
    p.allergensEn ?? null,
    p.allergensAr ?? null,
    now,
    id
  );

  res.json({ success: true });
});

apiRouter.delete('/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// 4. DELIVERY ZONES & OFFERS & PROMOS
// ==========================================

apiRouter.get('/delivery-zones', (_req: Request, res: Response) => {
  const zones = db.prepare('SELECT * FROM delivery_zones WHERE is_active = 1').all();
  res.json(zones);
});

apiRouter.get('/admin/delivery-zones', requireAdmin, (_req: Request, res: Response) => {
  const zones = db.prepare('SELECT * FROM delivery_zones').all();
  res.json(zones);
});

apiRouter.put('/admin/delivery-zones/:id', requireAdmin, (req: Request, res: Response) => {
  const { nameEn, nameAr, deliveryFeePiastres, minOrderPiastres, estimatedMinutes, isActive } = req.body;
  db.prepare(`
    UPDATE delivery_zones
    SET name_en = COALESCE(?, name_en),
        name_ar = COALESCE(?, name_ar),
        delivery_fee_piastres = COALESCE(?, delivery_fee_piastres),
        min_order_piastres = COALESCE(?, min_order_piastres),
        estimated_minutes = COALESCE(?, estimated_minutes),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    nameEn || null,
    nameAr || null,
    deliveryFeePiastres !== undefined ? parseInt(deliveryFeePiastres, 10) : null,
    minOrderPiastres !== undefined ? parseInt(minOrderPiastres, 10) : null,
    estimatedMinutes !== undefined ? parseInt(estimatedMinutes, 10) : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );
  res.json({ success: true });
});

apiRouter.get('/offers', (_req: Request, res: Response) => {
  const offers = db.prepare('SELECT * FROM offers WHERE is_active = 1 ORDER BY created_at DESC').all();
  res.json(offers);
});

apiRouter.post('/promo/validate', (req: Request, res: Response) => {
  const { code, subtotalPiastres } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Promo code is required.' });
    return;
  }

  const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(String(code).trim().toUpperCase()) as any;
  if (!promo) {
    res.status(400).json({ error: 'Invalid promo code.' });
    return;
  }

  const promoInput: PromoCodeInput = {
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
    minOrderPiastres: promo.min_order_piastres,
    maxDiscountPiastres: promo.max_discount_piastres,
    isActive: Boolean(promo.is_active),
    startsAt: promo.starts_at,
    expiresAt: promo.expires_at,
    usageLimit: promo.usage_limit,
    timesUsed: promo.times_used,
  };

  const validation = validatePromoCode(promoInput, parseInt(subtotalPiastres || 0, 10));
  if (!validation.valid) {
    res.status(400).json({ error: validation.reason });
    return;
  }

  res.json({
    valid: true,
    code: promo.code,
    discountPiastres: validation.discountPiastres,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
  });
});

// Admin Offers & Promos
apiRouter.post('/admin/offers', requireAdmin, (req: Request, res: Response) => {
  const { titleEn, titleAr, descriptionEn, descriptionAr, discountType, discountValue, minOrderPiastres, startsAt, endsAt, bannerUrl, promoCode } = req.body;
  const id = 'offer-' + crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO offers (
      id, title_en, title_ar, description_en, description_ar,
      discount_type, discount_value, min_order_piastres, starts_at, ends_at,
      is_active, banner_url, promo_code, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
  `).run(
    id,
    titleEn,
    titleAr,
    descriptionEn,
    descriptionAr,
    discountType || 'percentage',
    parseInt(discountValue, 10),
    parseInt(minOrderPiastres || 0, 10),
    startsAt || null,
    endsAt || null,
    bannerUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    promoCode || null,
    now
  );

  res.status(201).json({ id, success: true });
});

apiRouter.delete('/admin/offers/:id', requireAdmin, (req: Request, res: Response) => {
  db.prepare('DELETE FROM offers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// 5. FAVORITES
// ==========================================

apiRouter.get('/favorites', requireAuth, (req: AuthRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT p.*
    FROM favorites f
    JOIN products p ON p.id = f.product_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.user!.id) as any[];

  res.json(rows);
});

apiRouter.post('/favorites/toggle', requireAuth, (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: 'Product ID is required.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user!.id, productId);
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user!.id, productId);
    res.json({ isFavorite: false });
  } else {
    const id = 'fav-' + crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO favorites (id, user_id, product_id, created_at) VALUES (?, ?, ?, ?)').run(
      id,
      req.user!.id,
      productId,
      now
    );
    res.json({ isFavorite: true });
  }
});

// ==========================================
// 6. CHECKOUT & ORDERS (REAL PERSISTENCE & PRICING VERIFICATION)
// ==========================================

apiRouter.post('/orders', (req: AuthRequest, res: Response) => {
  const {
    items,
    orderType,
    deliveryZoneId,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryNotes,
    promoCode,
    paymentMethod = 'cash_on_delivery',
    idempotencyKey,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Your cart is empty. Please add items before checking out.' });
    return;
  }

  if (!customerName || !customerPhone) {
    res.status(400).json({ error: 'Customer name and phone number are required.' });
    return;
  }

  if (orderType === 'delivery' && (!deliveryAddress || !deliveryZoneId)) {
    res.status(400).json({ error: 'Delivery address and zone are required for delivery orders.' });
    return;
  }

  // Idempotency check: if order with this key exists, return it safely
  if (idempotencyKey) {
    const existingOrder = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(idempotencyKey) as any;
    if (existingOrder) {
      res.json({ success: true, orderId: existingOrder.id, orderNumber: existingOrder.order_number });
      return;
    }
  }

  // CRITICAL SECURITY: Never trust prices or totals from the client!
  // Re-fetch all products, variants, and addons from the database.
  const pricingItems: ItemPricingInput[] = [];
  const processedLineItems: Array<{
    productId: string;
    productNameEn: string;
    productNameAr: string;
    variantNameEn?: string;
    variantNameAr?: string;
    addonsSummary?: string;
    unitPricePiastres: number;
    quantity: number;
    totalPricePiastres: number;
    notes?: string;
  }> = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId) as any;
    if (!product) {
      res.status(400).json({ error: `Product not found: ${item.productId}` });
      return;
    }

    if (!product.is_available) {
      res.status(400).json({ error: `Item "${product.name_en}" is currently unavailable.` });
      return;
    }

    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    let variantAdjustment = 0;
    let variantNameEn = '';
    let variantNameAr = '';

    if (item.variantId) {
      const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(
        item.variantId,
        product.id
      ) as any;
      if (variant) {
        variantAdjustment = variant.price_adjustment_piastres;
        variantNameEn = variant.name_en;
        variantNameAr = variant.name_ar;
      }
    }

    const itemAddons: Array<{ pricePiastres: number; quantity: number }> = [];
    const addonNames: string[] = [];

    if (item.addons && Array.isArray(item.addons)) {
      for (const a of item.addons) {
        const addonDb = db.prepare('SELECT * FROM product_addons WHERE id = ?').get(a.id) as any;
        if (addonDb && addonDb.is_available) {
          const addonQty = Math.max(1, parseInt(a.quantity || 1, 10));
          itemAddons.push({ pricePiastres: addonDb.price_piastres, quantity: addonQty });
          addonNames.push(`${addonDb.name_en} x${addonQty}`);
        }
      }
    }

    const unitPrice = Math.max(0, product.base_price_piastres + variantAdjustment + itemAddons.reduce((s, a) => s + a.pricePiastres * a.quantity, 0));
    const lineTotal = unitPrice * qty;

    pricingItems.push({
      basePricePiastres: product.base_price_piastres,
      variantAdjustmentPiastres: variantAdjustment,
      addons: itemAddons,
      quantity: qty,
    });

    processedLineItems.push({
      productId: product.id,
      productNameEn: product.name_en,
      productNameAr: product.name_ar,
      variantNameEn: variantNameEn || undefined,
      variantNameAr: variantNameAr || undefined,
      addonsSummary: addonNames.length > 0 ? addonNames.join(', ') : undefined,
      unitPricePiastres: unitPrice,
      quantity: qty,
      totalPricePiastres: lineTotal,
      notes: item.notes ? String(item.notes).slice(0, 200) : undefined,
    });
  }

  // Fetch Delivery Zone
  let deliveryZone: DeliveryZoneInput | null = null;
  if (orderType === 'delivery') {
    const zoneDb = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(deliveryZoneId) as any;
    if (zoneDb) {
      deliveryZone = {
        id: zoneDb.id,
        nameEn: zoneDb.name_en,
        nameAr: zoneDb.name_ar,
        deliveryFeePiastres: zoneDb.delivery_fee_piastres,
        minOrderPiastres: zoneDb.min_order_piastres,
        estimatedMinutes: zoneDb.estimated_minutes,
        isActive: Boolean(zoneDb.is_active),
      };
    }
  }

  // Fetch Promo Code
  let promoObj: PromoCodeInput | null = null;
  if (promoCode) {
    const promoDb = db.prepare('SELECT * FROM promo_codes WHERE code = ?').get(String(promoCode).trim().toUpperCase()) as any;
    if (promoDb) {
      promoObj = {
        code: promoDb.code,
        discountType: promoDb.discount_type,
        discountValue: promoDb.discount_value,
        minOrderPiastres: promoDb.min_order_piastres,
        maxDiscountPiastres: promoDb.max_discount_piastres,
        isActive: Boolean(promoDb.is_active),
        startsAt: promoDb.starts_at,
        expiresAt: promoDb.expires_at,
        usageLimit: promoDb.usage_limit,
        timesUsed: promoDb.times_used,
      };
    }
  }

  // Recalculate everything strictly on the server
  const totals = calculateOrderTotals({
    items: pricingItems,
    orderType: orderType === 'pickup' ? 'pickup' : 'delivery',
    deliveryZone,
    promo: promoObj,
    now: new Date(),
  });

  if (totals.error) {
    res.status(400).json({ error: totals.error });
    return;
  }

  const orderId = 'ord-' + crypto.randomUUID();
  const orderNumber = 'EGY-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date().toISOString();
  const userId = req.user ? req.user.id : null;

  // Atomically persist order and order items
  db.exec('BEGIN TRANSACTION');
  try {
    db.prepare(`
      INSERT INTO orders (
        id, order_number, user_id, idempotency_key, customer_name, customer_phone,
        order_type, delivery_zone_id, delivery_address, delivery_notes,
        subtotal_piastres, discount_piastres, delivery_fee_piastres, total_piastres,
        payment_method, payment_status, order_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?, ?)
    `).run(
      orderId,
      orderNumber,
      userId,
      idempotencyKey || null,
      customerName,
      customerPhone,
      orderType === 'pickup' ? 'pickup' : 'delivery',
      deliveryZoneId || null,
      deliveryAddress || null,
      deliveryNotes || null,
      totals.subtotalPiastres,
      totals.discountPiastres,
      totals.deliveryFeePiastres,
      totals.totalPiastres,
      paymentMethod === 'cash_on_pickup' ? 'cash_on_pickup' : 'cash_on_delivery',
      now,
      now
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (
        id, order_id, product_id, product_name_en, product_name_ar,
        variant_name_en, variant_name_ar, addons_summary, unit_price_piastres,
        quantity, total_price_piastres, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of processedLineItems) {
      insertItem.run(
        'item-' + crypto.randomUUID(),
        orderId,
        item.productId,
        item.productNameEn,
        item.productNameAr,
        item.variantNameEn || null,
        item.variantNameAr || null,
        item.addonsSummary || null,
        item.unitPricePiastres,
        item.quantity,
        item.totalPricePiastres,
        item.notes || null
      );
    }

    // Insert initial status history
    db.prepare(`
      INSERT INTO order_status_history (id, order_id, status, notes, changed_by, created_at)
      VALUES (?, ?, 'pending', 'Order placed by customer', 'customer', ?)
    `).run('hist-' + crypto.randomUUID(), orderId, now);

    // Increment promo usage if used
    if (promoObj) {
      db.prepare('UPDATE promo_codes SET times_used = times_used + 1 WHERE code = ?').run(promoObj.code);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Failed to create order:', err);
    res.status(500).json({ error: 'An unexpected error occurred while placing your order. Please try again.' });
    return;
  }

  res.status(201).json({
    success: true,
    orderId,
    orderNumber,
    totalPiastres: totals.totalPiastres,
    subtotalPiastres: totals.subtotalPiastres,
    deliveryFeePiastres: totals.deliveryFeePiastres,
    discountPiastres: totals.discountPiastres,
  });
});

// Customer order history
apiRouter.get('/orders', requireAuth, (req: AuthRequest, res: Response) => {
  const orders = db.prepare(`
    SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user!.id) as any[];

  const orderIds = orders.map((o) => o.id);
  const items = orderIds.length > 0
    ? (db.prepare(`SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`).all(...orderIds) as any[])
    : [];

  const enriched = orders.map((o) => ({
    ...o,
    items: items.filter((i) => i.order_id === o.id),
  }));

  res.json(enriched);
});

// Order Tracking / Single Order
apiRouter.get('/orders/:id', (req: AuthRequest, res: Response) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(
    req.params.id,
    req.params.id
  ) as any;

  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  // Authorization check: if order has user_id and request user is authenticated, must match user or be admin
  if (order.user_id && req.user && req.user.role !== 'admin' && req.user.id !== order.user_id) {
    res.status(403).json({ error: 'Access denied to this order.' });
    return;
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
  const zone = order.delivery_zone_id ? db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(order.delivery_zone_id) : null;

  res.json({
    ...order,
    items,
    history,
    deliveryZone: zone,
  });
});

// ==========================================
// 7. ADMIN DASHBOARD & MANAGEMENT
// ==========================================

apiRouter.get('/admin/orders', requireAdmin, (req: Request, res: Response) => {
  const { status, search } = req.query;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' AND order_status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';

  const orders = db.prepare(query).all(...params) as any[];
  const orderIds = orders.map((o) => o.id);
  const items = orderIds.length > 0
    ? (db.prepare(`SELECT * FROM order_items WHERE order_id IN (${orderIds.map(() => '?').join(',')})`).all(...orderIds) as any[])
    : [];

  const enriched = orders.map((o) => ({
    ...o,
    items: items.filter((i) => i.order_id === o.id),
  }));

  res.json(enriched);
});

apiRouter.put('/admin/orders/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  const { status, notes } = req.body;
  const allowed = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: 'Invalid order status.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);

  db.prepare(`
    INSERT INTO order_status_history (id, order_id, status, notes, changed_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('hist-' + crypto.randomUUID(), req.params.id, status, notes || `Status changed to ${status}`, req.user!.fullName, now);

  res.json({ success: true, status });
});

// Admin Analytics (from real persisted orders)
apiRouter.get('/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const totalRevenue = (db.prepare(`
    SELECT COALESCE(SUM(total_piastres), 0) as total FROM orders WHERE order_status != 'cancelled'
  `).get() as any).total;

  const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
  const pendingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'pending'").get() as any).count;
  const preparingOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'preparing'").get() as any).count;

  const popularDishes = db.prepare(`
    SELECT product_name_en, product_name_ar, SUM(quantity) as total_qty, SUM(total_price_piastres) as total_sales
    FROM order_items
    GROUP BY product_name_en
    ORDER BY total_qty DESC
    LIMIT 5
  `).all();

  const recentOrders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    totalRevenuePiastres: totalRevenue,
    totalOrders,
    pendingOrders,
    preparingOrders,
    popularDishes,
    recentOrders,
  });
});

// Admin Customers Directory
apiRouter.get('/admin/customers', requireAdmin, (_req: Request, res: Response) => {
  const customers = db.prepare(`
    SELECT p.id, p.email, p.full_name, p.phone, p.default_address, p.created_at,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_piastres), 0) as total_spent_piastres
    FROM profiles p
    LEFT JOIN orders o ON o.user_id = p.id AND o.order_status != 'cancelled'
    GROUP BY p.id
    ORDER BY total_spent_piastres DESC, p.created_at DESC
  `).all();

  res.json(customers);
});

// Admin Inventory Management
apiRouter.get('/admin/inventory', requireAdmin, (_req: Request, res: Response) => {
  const products = db.prepare(`
    SELECT id, name_en, name_ar, base_price_piastres, stock_quantity, is_available, category_id
    FROM products
    ORDER BY name_en ASC
  `).all();
  res.json(products);
});

apiRouter.put('/admin/inventory/:id', requireAdmin, (req: Request, res: Response) => {
  const { stockQuantity, isAvailable } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products
    SET stock_quantity = COALESCE(?, stock_quantity),
        is_available = COALESCE(?, is_available),
        updated_at = ?
    WHERE id = ?
  `).run(
    stockQuantity !== undefined ? parseInt(stockQuantity, 10) : null,
    isAvailable !== undefined ? (isAvailable ? 1 : 0) : null,
    now,
    req.params.id
  );

  res.json({ success: true });
});
