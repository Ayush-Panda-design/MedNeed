'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Medicine,
  DiagnosticTest,
  Order,
  FranchiseInquiry,
  DiscountRule,
  AdminUser,
  AuditLog,
  AdminRole,
  UserRole,
  AuthUser,
  OrderStatus,
  OrderItem,
  DiagnosticAppointment,
} from '@/types';
import {
  INITIAL_ADMINS,
  INITIAL_MEDICINES,
  INITIAL_DIAGNOSTICS,
  INITIAL_ORDERS,
  INITIAL_FRANCHISE_INQUIRIES,
  INITIAL_DISCOUNT_RULES,
  INITIAL_AUDIT_LOGS,
} from '@/data/mockData';

export interface CartItem {
  id: string;
  title: string;
  type: 'MEDICINE' | 'DIAGNOSTIC_TEST';
  mrp: number;
  sellingPrice: number;
  quantity: number;
  requiresPrescription?: boolean;
  schedule?: 'OTC' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
  batchNumber?: string;
  category?: string;
  patientDetails?: DiagnosticAppointment;
}

interface AppContextType {
  // Catalog
  medicines: Medicine[];
  totalMedicineCount: number;
  diagnostics: DiagnosticTest[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  deliveryFee: number;
  cartFinalTotal: number;

  // Pincode & 5-10km Radius
  userPincode: string;
  isServiceable: boolean;
  deliveryDistanceKm: number;
  deliveryEstimateText: string;
  verifyDeliveryPincode: (pincode: string) => { serviceable: boolean; distance: number; message: string };

  // Orders & Delivery Tracking
  orders: Order[];
  createOrder: (orderData: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (
    orderId: string,
    newStatus: OrderStatus,
    deliveryUpdate?: { riderName?: string; riderPhone?: string; estimatedMinutes?: number; deliveryOtp?: string }
  ) => Promise<boolean>;
  verifyPrescription: (orderId: string, approved: boolean, reason?: string) => Promise<boolean>;
  getOrderById: (orderId: string) => Order | undefined;

  // Franchise
  franchiseInquiries: FranchiseInquiry[];
  submitFranchiseInquiry: (data: Omit<FranchiseInquiry, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  updateFranchiseStatus: (id: string, status: FranchiseInquiry['status'], notes?: string) => Promise<boolean>;

  // Bulk Discount Engine
  discountRules: DiscountRule[];
  applyBulkDiscount: (scope: 'ALL_MEDICINES' | 'CATEGORY', percentage: number, targetCategory?: string) => Promise<boolean>;
  toggleDiscountRule: (id: string) => void;

  // LocalWell Stock Sync
  syncLocalWellStock: (fileName?: string) => { count: number; message: string };
  updateMedicineMRP: (medicineId: string, newMrp: number, reason: string) => void;

  // Admins & RBAC
  admins: AdminUser[];
  currentAdmin: AdminUser;
  switchAdminRole: (role: AdminRole) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (actionType: AuditLog['actionType'], details: string, oldValue?: string, newValue?: string) => void;

  // Authentication & Role
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  signIn: (email: string, password?: string, role?: UserRole, provider?: 'email' | 'google', name?: string) => Promise<AuthUser>;
  signUp: (userData: Partial<AuthUser>) => Promise<AuthUser>;
  signOut: () => void;
  signInWithGoogle: (token?: string, tokenType?: 'credential' | 'accessToken') => Promise<AuthUser>;

  // Razorpay & Flipkart Checkout Flow
  createRazorpayOrder: (orderPayload: any) => Promise<any>;
  verifyRazorpayPayment: (verificationPayload: any) => Promise<any>;
  syncAndMergeUserCart: () => Promise<void>;
}

const GUEST_CART_STORAGE_KEY = 'medneed_guest_cart';

interface GuestCartStorageItem {
  id: string;
  type?: 'MEDICINE' | 'DIAGNOSTIC_TEST';
  quantity: number;
}

function saveGuestCartToStorage(cartItems: CartItem[]) {
  if (typeof window === 'undefined') return;
  // Flipkart requirement: store ONLY product IDs, variant/type, and quantities. Never trusted prices.
  const payload: GuestCartStorageItem[] = cartItems.map((item) => ({
    id: item.id,
    type: item.type,
    quantity: item.quantity,
  }));
  localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(payload));
}

function getGuestCartFromStorage(): GuestCartStorageItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [totalMedicineCount, setTotalMedicineCount] = useState<number>(30801);
  const [diagnostics, setDiagnostics] = useState<DiagnosticTest[]>(INITIAL_DIAGNOSTICS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [userPincode, setUserPincode] = useState('751035');
  const [isServiceable, setIsServiceable] = useState(true);
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(1.2);
  const [deliveryEstimateText, setDeliveryEstimateText] = useState('Express 45-60 mins (From Rudhrapur/Pahal Hub)');

  const [orders, setOrders] = useState<Order[]>([]);
  const [franchiseInquiries, setFranchiseInquiries] = useState<FranchiseInquiry[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(INITIAL_DISCOUNT_RULES);
  const [admins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser>(INITIAL_ADMINS[0]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Auth User State (Unauthenticated by default until session verified)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Synchronize and merge guest cart into user account
  const syncAndMergeUserCart = async () => {
    try {
      const guestItems = getGuestCartFromStorage();
      if (guestItems.length > 0) {
        await fetch('/api/cart/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestCart: guestItems }),
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        }
      }

      // Fetch user's synchronized server cart
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setCart(data.items);
      }
    } catch (err) {
      console.warn('Cart sync/merge error:', err);
    }
  };

  const signIn = async (
    email: string,
    password = 'password123',
    role: UserRole = 'CUSTOMER',
    provider: 'email' | 'google' = 'email',
    name?: string
  ): Promise<AuthUser> => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, provider, name }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.user.role !== 'CUSTOMER') {
          const found = admins.find((a) => a.role === data.user.role);
          if (found) setCurrentAdmin(found);
        }
        // Auto-merge guest cart into user DB cart
        await syncAndMergeUserCart();
        return data.user;
      } else {
        throw new Error(data.error || 'Invalid credentials');
      }
    } catch (err: any) {
      console.warn('Sign in error:', err);
      throw err;
    }
  };

  const signUp = async (userData: Partial<AuthUser>): Promise<AuthUser> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.user.role !== 'CUSTOMER') {
          const found = admins.find((a) => a.role === data.user.role);
          if (found) setCurrentAdmin(found);
        }
        await syncAndMergeUserCart();
        return data.user;
      }
    } catch (err) {
      console.warn('Real JWT API signup fallback:', err);
    }

    const authUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: userData.name || 'New Member',
      email: userData.email || 'customer@medneed.com',
      phone: userData.phone,
      role: userData.role || 'CUSTOMER',
      provider: userData.provider || 'email',
      avatar: userData.role === 'CUSTOMER' ? '👤' : '👨‍⚕️',
      pharmacistLicenseNumber: userData.pharmacistLicenseNumber,
    };
    setCurrentUser(authUser);
    await syncAndMergeUserCart();
    return authUser;
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (err) {}
    setCurrentUser(null);
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  };

  const signInWithGoogle = async (
    token?: string,
    tokenType: 'credential' | 'accessToken' = 'credential'
  ): Promise<AuthUser> => {
    if (!token) {
      throw new Error('Google authentication token is required. Please choose an account in the Google prompt.');
    }

    const payload = tokenType === 'accessToken' ? { accessToken: token } : { credential: token };

    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success || !data.user) {
      throw new Error(data.error || 'Google authentication failed');
    }

    setCurrentUser(data.user);
    if (data.user.role !== 'CUSTOMER') {
      const found = admins.find((a) => a.role === data.user.role);
      if (found) setCurrentAdmin(found);
    }
    await syncAndMergeUserCart();
    return data.user;
  };

  // Sync public catalogue & user session on mount
  useEffect(() => {
    async function fetchPublicInitialData() {
      try {
        const [meRes, medsRes, diagRes] = await Promise.allSettled([
          fetch('/api/auth/me').then((r) => r.json()),
          fetch('/api/medicines').then((r) => r.json()),
          fetch('/api/diagnostic-tests').then((r) => r.json()),
        ]);

        if (meRes.status === 'fulfilled' && meRes.value.success && meRes.value.user) {
          setCurrentUser(meRes.value.user);
          if (meRes.value.user.role !== 'CUSTOMER') {
            const found = admins.find((a) => a.role === meRes.value.user.role);
            if (found) setCurrentAdmin(found);
          }
        }

        if (diagRes.status === 'fulfilled' && diagRes.value.success && diagRes.value.data?.length > 0) {
          setDiagnostics(diagRes.value.data);
        }

        if (medsRes.status === 'fulfilled' && medsRes.value.success && medsRes.value.data?.length > 0) {
          if (medsRes.value.total) {
            setTotalMedicineCount(medsRes.value.total);
          }
          const mapped = medsRes.value.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            brand: m.brand,
            salt: m.saltComposition || m.salt || m.name,
            category: m.category,
            mrp: Number(m.baseMrp || m.mrp),
            discountPercentage: Number(m.discountPercentage || 0),
            sellingPrice: Number(m.sellingPrice || m.baseMrp || m.mrp),
            costPrice: m.batches?.[0]?.purchaseRate ? Number(m.batches[0].purchaseRate) : Number(m.costPrice || 25),
            requiresPrescription: m.requiresPrescription ?? false,
            stockQty: m.batches?.[0]?.quantity ?? m.stockQty ?? 100,
            batchNumber: m.batches?.[0]?.batchNumber ?? m.batchNumber ?? 'ML-2024-B1',
            expiryDate: m.batches?.[0]?.expiryDate ? new Date(m.batches[0].expiryDate).toISOString().substring(0, 7) : (m.expiryDate || '2026-12'),
            packaging: m.packaging || 'Strip of 10 Tablets',
            dosageForm: m.dosageForm || 'Tablet',
            localWellCode: m.localWellCode,
            description: m.description || '',
          }));
          setMedicines(mapped);
        }
      } catch (err) {
        console.warn('Initial public catalog sync error:', err);
      }
    }

    fetchPublicInitialData();
  }, []);

  // Fetch private customer orders and staff endpoints strictly when authorized
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setAuditLogs([]);
      setFranchiseInquiries([]);
      return;
    }

    // 1. Fetch user orders (Only for authenticated user)
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        }
      })
      .catch((err) => console.warn('User orders fetch error:', err));

    // 2. Fetch staff-only regulatory audit trails and franchise inquiries
    const staffRoles = ['SUPER_ADMIN', 'STORE_MANAGER', 'PHARMACIST', 'AUDIT_OFFICER'];
    if (staffRoles.includes(currentUser.role)) {
      fetch('/api/audit-logs')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setAuditLogs(data.data);
          }
        })
        .catch((err) => console.warn('Audit logs fetch error:', err));

      fetch('/api/franchise')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setFranchiseInquiries(data.data);
          }
        })
        .catch((err) => console.warn('Franchise inquiries fetch error:', err));
    } else {
      setAuditLogs([]);
      setFranchiseInquiries([]);
    }
  }, [currentUser]);

  // Dynamic search querying the 30,801 medicines in Supabase
  useEffect(() => {
    if (!searchQuery.trim() && selectedCategory === 'All') return;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedCategory !== 'All') params.set('category', selectedCategory);
        params.set('limit', '500');

        const res = await fetch(`/api/medicines?${params.toString()}`).then((r) => r.json());
        if (res.success && res.data) {
          if (res.total) setTotalMedicineCount(res.total);
          const mapped = res.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            brand: m.brand,
            salt: m.saltComposition || m.salt || m.name,
            category: m.category,
            mrp: Number(m.baseMrp || m.mrp),
            discountPercentage: Number(m.discountPercentage || 0),
            sellingPrice: Number(m.sellingPrice || m.baseMrp || m.mrp),
            costPrice: m.batches?.[0]?.purchaseRate ? Number(m.batches[0].purchaseRate) : Number(m.costPrice || 25),
            requiresPrescription: m.requiresPrescription ?? false,
            stockQty: m.batches?.[0]?.quantity ?? m.stockQty ?? 100,
            batchNumber: m.batches?.[0]?.batchNumber ?? m.batchNumber ?? 'ML-2024-B1',
            expiryDate: m.batches?.[0]?.expiryDate ? new Date(m.batches[0].expiryDate).toISOString().substring(0, 7) : (m.expiryDate || '2026-12'),
            packaging: m.packaging || 'Strip of 10 Tablets',
            dosageForm: m.dosageForm || 'Tablet',
            localWellCode: m.localWellCode,
            description: m.description || '',
          }));
          setMedicines(mapped);
        }
      } catch (e) {
        console.warn('Search query API error:', e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Helper to add audit log
  const addAuditLog = (
    actionType: AuditLog['actionType'],
    details: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName: currentAdmin.name,
      actorRole: currentAdmin.role,
      actionType,
      details,
      oldValue,
      newValue,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch Admin Role
  const switchAdminRole = (role: AdminRole) => {
    const found = admins.find((a) => a.role === role) || admins[0];
    setCurrentAdmin(found);
    addAuditLog('ORDER_STATUS_UPDATED', `Switched active dashboard view to ${found.name} (${found.role})`);
  };

  // Recalculate medicine prices when discount rules change
  const recalculateMedicinePrices = (rules: DiscountRule[], currentMeds: Medicine[]) => {
    return currentMeds.map((med) => {
      // Find highest applicable active discount
      let highestDiscount = 0;
      rules.forEach((rule) => {
        if (!rule.isActive) return;
        if (rule.scope === 'ALL_MEDICINES') {
          if (rule.discountPercentage > highestDiscount) highestDiscount = rule.discountPercentage;
        } else if (rule.scope === 'CATEGORY' && rule.targetCategory === med.category) {
          if (rule.discountPercentage > highestDiscount) highestDiscount = rule.discountPercentage;
        }
      });

      // Retain at least original discount if greater
      const finalDiscount = Math.max(highestDiscount, med.discountPercentage);
      const newSellingPrice = Number((med.mrp * (1 - finalDiscount / 100)).toFixed(2));
      return {
        ...med,
        discountPercentage: finalDiscount,
        sellingPrice: newSellingPrice,
      };
    });
  };

  // Apply Bulk Discount
  const applyBulkDiscount = async (
    scope: 'ALL_MEDICINES' | 'CATEGORY',
    percentage: number,
    targetCategory?: string
  ): Promise<boolean> => {
    try {
      await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, percentage, targetCategory }),
      });
    } catch (err) {
      console.warn('Discount sync error:', err);
    }

    const newRule: DiscountRule = {
      id: `disc-${Date.now()}`,
      title: scope === 'ALL_MEDICINES' ? `Storewide Flat ${percentage}% OFF` : `${targetCategory} Special ${percentage}% OFF`,
      scope,
      targetCategory,
      discountPercentage: percentage,
      isActive: true,
      updatedBy: currentAdmin.name,
      updatedAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
    };

    const updatedRules = [newRule, ...discountRules];
    setDiscountRules(updatedRules);

    setMedicines((prev) => {
      const updatedMeds = prev.map((med) => {
        let shouldApply = false;
        if (scope === 'ALL_MEDICINES') shouldApply = true;
        if (scope === 'CATEGORY' && med.category === targetCategory) shouldApply = true;

        if (shouldApply) {
          const discount = Math.max(percentage, med.discountPercentage);
          const newPrice = Number((med.mrp * (1 - discount / 100)).toFixed(2));
          return {
            ...med,
            discountPercentage: discount,
            sellingPrice: newPrice,
          };
        }
        return med;
      });
      return updatedMeds;
    });

    addAuditLog(
      'BULK_DISCOUNT_APPLIED',
      `Applied ${percentage}% discount on ${scope === 'ALL_MEDICINES' ? 'ALL MEDICINES' : targetCategory}`,
      'Previous',
      `${percentage}%`
    );
    return true;
  };

  // Toggle Discount Rule
  const toggleDiscountRule = (id: string) => {
    setDiscountRules((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const toggled = !r.isActive;
          addAuditLog(
            'BULK_DISCOUNT_APPLIED',
            `${toggled ? 'Activated' : 'Deactivated'} discount rule: "${r.title}"`
          );
          return { ...r, isActive: toggled };
        }
        return r;
      })
    );
  };

  // LocalWell Stock Sync
  const syncLocalWellStock = (fileName = 'LocalWell_Stock_Export.xlsx') => {
    // Simulate updating stock and new batches from LocalWell billing export
    setMedicines((prev) =>
      prev.map((m) => ({
        ...m,
        stockQty: m.stockQty + Math.floor(Math.random() * 20) + 5,
      }))
    );
    const count = medicines.length;
    addAuditLog(
      'LOCALWELL_STOCK_SYNCED',
      `Synced ${count} items with LocalWell ERP from file: ${fileName}. Batches and stock counts updated.`
    );
    return { count, message: `Successfully synced ${count} medicines with LocalWell ERP!` };
  };

  // Cost Inflation / MRP adjustment (DPCO & Manufacturer Hike)
  const updateMedicineMRP = (medicineId: string, newMrp: number, reason: string) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id === medicineId) {
          const oldMrp = med.mrp;
          const newSelling = Number((newMrp * (1 - med.discountPercentage / 100)).toFixed(2));
          addAuditLog(
            'PRICE_INFLATION_ADJUSTED',
            `Adjusted MRP of ${med.name} due to: ${reason}`,
            `₹${oldMrp}`,
            `₹${newMrp}`
          );
          return {
            ...med,
            mrp: newMrp,
            sellingPrice: newSelling,
          };
        }
        return med;
      })
    );
  };

  // Pincode & 5-10km Verification (Bhubaneswar Hub: 751035 Rudhrapur/Balianta & Nakhara)
  const verifyDeliveryPincode = (pincode: string) => {
    const pinNum = parseInt(pincode.replace(/\D/g, ''), 10);
    // Simulation: Valid 6 digit Indian pincode
    if (pincode.length !== 6 || isNaN(pinNum)) {
      return { serviceable: false, distance: 0, message: 'Please enter a valid 6-digit Pincode' };
    }

    // Determine simulated distance relative to MedNeed Bhubaneswar & Nakhara hubs
    const prefix3 = pincode.substring(0, 3);
    const lastDigit = pinNum % 10;
    let dist = 3.0;

    if (pincode === '751035') {
      // Local MedNeed Head Dispensary (Pahal / Balianta / Rudhrapur)
      dist = 0.8;
    } else if (prefix3 === '751') {
      // Bhubaneswar City
      dist = Number((1.5 + (lastDigit * 0.4)).toFixed(1));
    } else if (prefix3 === '752') {
      // Nakhara / DPS Road / Balianta / Puri Road corridor
      dist = Number((2.0 + (lastDigit * 0.5)).toFixed(1));
    } else if (prefix3 === '753') {
      // Cuttack City Twin Hub
      dist = Number((6.5 + (lastDigit * 0.3)).toFixed(1));
    } else {
      // Other regions
      dist = Number((3.0 + (lastDigit * 0.8)).toFixed(1));
    }

    if (dist <= 5.0) {
      setIsServiceable(true);
      setDeliveryDistanceKm(dist);
      setDeliveryEstimateText(`Express dispatch (${dist} km away)`);
      setUserPincode(pincode);
      return { serviceable: true, distance: dist, message: `Express delivery available (${dist} km from Bhubaneswar Hub)` };
    } else if (dist <= 10.0) {
      setIsServiceable(true);
      setDeliveryDistanceKm(dist);
      setDeliveryEstimateText(`Standard delivery (${dist} km away)`);
      setUserPincode(pincode);
      return { serviceable: true, distance: dist, message: `Standard delivery available (${dist} km from Nakhara/Pahal Hub)` };
    } else {
      setIsServiceable(false);
      setDeliveryDistanceKm(dist);
      setDeliveryEstimateText('Outside local delivery radius');
      return {
        serviceable: false,
        distance: dist,
        message: `Your location is ${dist} km away. Local doorstep delivery currently covers up to 10 km from our Bhubaneswar hubs.`,
      };
    }
  };

  // Cart operations (Dual-Mode: LocalStorage for Guests, Supabase Server for Authenticated Users)
  const addToCart = (item: CartItem) => {
    // Statutory prohibition: Schedule X narcotics & psychotropics cannot be sold online
    if (item.schedule === 'SCHEDULE_X') {
      alert(
        `Schedule X Restricted Medicine: "${item.title}" is classified as a Schedule X controlled substance. Under the Drugs & Cosmetics Act (Rule 65/97), Schedule X medications cannot be sold or dispensed via online mail-order pharmacies. They must be purchased in person at a licensed pharmacy with a physical duplicate prescription.`
      );
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i));
      } else {
        updated = [...prev, item];
      }

      if (!currentUser) {
        saveGuestCartToStorage(updated);
      }
      return updated;
    });

    if (currentUser) {
      const existing = cart.find((i) => i.id === item.id);
      const newQty = existing ? existing.quantity + item.quantity : item.quantity;
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, itemType: item.type, quantity: newQty }),
      }).catch((e) => console.warn('Cart server sync error:', e));
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      if (!currentUser) {
        saveGuestCartToStorage(updated);
      }
      return updated;
    });

    if (currentUser) {
      fetch(`/api/cart?itemId=${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch((e) => console.warn('Cart server delete error:', e));
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];

      if (!currentUser) {
        saveGuestCartToStorage(updated);
      }
      return updated;
    });

    if (currentUser) {
      const item = cart.find((i) => i.id === id);
      if (item) {
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) {
          fetch(`/api/cart?itemId=${encodeURIComponent(id)}`, { method: 'DELETE' })
            .catch((e) => console.warn('Cart server delete error:', e));
        } else {
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: id, itemType: item.type, quantity: nextQty }),
          }).catch((e) => console.warn('Cart server update error:', e));
        }
      }
    }
  };

  const clearCart = () => {
    setCart([]);
    if (!currentUser) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      }
    } else {
      fetch('/api/cart?clearAll=true', { method: 'DELETE' })
        .catch((e) => console.warn('Cart server clear error:', e));
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const cartDiscount = cart.reduce(
    (sum, item) => sum + (item.mrp - item.sellingPrice) * item.quantity,
    0
  );
  // Free delivery above ₹200, else ₹35
  const deliveryFee = cartSubtotal > 0 && cartSubtotal - cartDiscount < 200 ? 35 : 0;
  const cartFinalTotal = Math.max(0, Number((cartSubtotal - cartDiscount + deliveryFee).toFixed(2)));

  // Razorpay Order Creation (Server-side authenticated)
  const createRazorpayOrder = async (orderPayload: any) => {
    const res = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Could not initiate Razorpay order');
    }
    return data;
  };

  // Razorpay Verification (Cryptographic HMAC check + Stock deduction + Cart clear)
  const verifyRazorpayPayment = async (verificationPayload: any) => {
    const res = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationPayload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Payment verification failed');
    }
    // Cart is confirmed cleared on backend, now clear local state
    setCart([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
    return data;
  };

  // Orders & Tracking
  // Orders & Tracking
  const createOrder = async (orderData: Partial<Order>): Promise<Order> => {
    const items = cart.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      mrp: c.mrp,
      sellingPrice: c.sellingPrice,
      quantity: c.quantity,
      requiresPrescription: c.requiresPrescription,
      batchNumber: c.batchNumber,
      category: c.category,
      patientDetails: c.patientDetails,
    }));

    const hasRx = items.some((i) => i.requiresPrescription);
    const isConsult = Boolean(orderData.doctorConsultRequired);

    const payload = {
      customerName: orderData.customerName || 'Customer',
      customerPhone: orderData.customerPhone || '+91 98765 00000',
      customerEmail: orderData.customerEmail,
      address: orderData.address || 'Address provided at checkout',
      pincode: orderData.pincode || userPincode,
      distanceKm: deliveryDistanceKm,
      items,
      paymentMethod: orderData.paymentMethod || 'RAZORPAY_UPI',
      prescriptionUrl: orderData.prescriptionUrl,
      doctorConsultRequired: isConsult,
      diagnosticAppointment: orderData.diagnosticAppointment,
      razorpayPaymentId: orderData.razorpayPaymentId,
    };

    let serverOrderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    let serverOtp = Math.floor(1000 + Math.random() * 9000).toString();
    let finalOrderData: any = null;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Could not place order');
    }
    if (data.orderId) serverOrderId = data.orderId;
    if (data.otp) serverOtp = data.otp;
    if (data.data) finalOrderData = data.data;

    const newOrder: Order = {
      id: serverOrderId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      address: payload.address,
      pincode: payload.pincode,
      distanceKm: deliveryDistanceKm,
      items: cart.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        mrp: c.mrp,
        unitPrice: c.sellingPrice,
        quantity: c.quantity,
        requiresPrescription: c.requiresPrescription,
        batchNumber: c.batchNumber || 'LW-BATCH-CURR',
        patientDetails: c.patientDetails,
      })),
      subtotal: finalOrderData?.subtotal ? Number(finalOrderData.subtotal) : cartSubtotal,
      discountTotal: finalOrderData?.discountTotal ? Number(finalOrderData.discountTotal) : cartDiscount,
      deliveryFee: finalOrderData?.deliveryFee !== undefined ? Number(finalOrderData.deliveryFee) : deliveryFee,
      finalTotal: finalOrderData?.finalTotal ? Number(finalOrderData.finalTotal) : cartFinalTotal,
      paymentMethod: payload.paymentMethod as any,
      paymentStatus: (finalOrderData?.paymentStatus || (payload.paymentMethod === 'COD' ? 'PENDING' : 'PAID')) as any,
      orderStatus: (finalOrderData?.orderStatus || ((hasRx || isConsult) ? 'RX_VERIFICATION' : 'PACKED')) as any,
      prescriptionUrl: payload.prescriptionUrl,
      prescriptionStatus: (finalOrderData?.prescriptionStatus || (hasRx ? 'PENDING_REVIEW' : 'NOT_REQUIRED')) as any,
      doctorConsultRequired: isConsult,
      doctorConsultStatus: isConsult ? 'PENDING_CALL' : 'NOT_REQUIRED',
      diagnosticAppointment: payload.diagnosticAppointment,
      delivery: {
        riderName: finalOrderData?.riderName || 'Vikrant Roy',
        riderPhone: finalOrderData?.riderPhone || '+91 98330 11223',
        deliveryOtp: serverOtp,
        estimatedMinutes: Math.round(deliveryDistanceKm * 10 + 15),
      },
      trackingHistory: [
        {
          status: 'PLACED',
          title: 'Order Placed Successfully',
          description: `Order of ₹${finalOrderData?.finalTotal || cartFinalTotal} confirmed. Payment mode: ${payload.paymentMethod}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
          current: false,
        },
        {
          status: 'RX_VERIFICATION',
          title: isConsult
            ? 'Doctor Teleconsultation Scheduled'
            : (hasRx ? 'Prescription Under Pharmacist Review' : 'Prescription Verified'),
          description: isConsult
            ? `Verified MBBS practitioner will call on ${payload.customerPhone} within 10 minutes to verify symptoms and generate digital Rx.`
            : (hasRx ? 'Registered Pharmacist reviewing your uploaded prescription.' : 'All items Over-The-Counter (OTC). Ready for dispatch.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: !hasRx && !isConsult,
          current: hasRx || isConsult,
        },
        {
          status: 'PACKED',
          title: 'Quality Checked & Packed',
          description: 'Medicines and sterile diagnostic kits packed in tamper-evident sealed box.',
          timestamp: (hasRx || isConsult) ? 'Pending' : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: !hasRx && !isConsult,
          current: !hasRx && !isConsult,
        },
        {
          status: 'OUT_FOR_DELIVERY',
          title: 'Out for Delivery (5-10km Radius)',
          description: `Delivery OTP: ${serverOtp}`,
          timestamp: 'Pending',
          completed: false,
          current: false,
        },
        {
          status: 'DELIVERED',
          title: 'Delivered',
          description: 'Package handed over with OTP verification.',
          timestamp: 'Pending',
          completed: false,
          current: false,
        },
      ],
      createdAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    addAuditLog(
      'ORDER_STATUS_UPDATED',
      `New order created: #${newOrder.id} by ${newOrder.customerName} (₹${newOrder.finalTotal}). Status: ${newOrder.orderStatus}`
    );

    return newOrder;
  };

  // Update Order Status & Rider
  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    deliveryUpdate?: { riderName?: string; riderPhone?: string; estimatedMinutes?: number; deliveryOtp?: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          newStatus,
          riderName: deliveryUpdate?.riderName,
          riderPhone: deliveryUpdate?.riderPhone,
          estimatedMinutes: deliveryUpdate?.estimatedMinutes,
          deliveryOtp: deliveryUpdate?.deliveryOtp,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update order status');
      }
    } catch (err: any) {
      console.warn('Dispatch API error:', err);
      throw err;
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const oldStatus = order.orderStatus;
          const updatedHistory = order.trackingHistory.map((step) => {
            if (step.status === newStatus) {
              return {
                ...step,
                completed: true,
                current: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
            }
            const stepOrder: OrderStatus[] = [
              'PLACED',
              'RX_VERIFICATION',
              'PACKED',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
            ];
            const currentIndex = stepOrder.indexOf(newStatus);
            const thisIndex = stepOrder.indexOf(step.status);
            return {
              ...step,
              completed: thisIndex <= currentIndex,
              current: thisIndex === currentIndex,
            };
          });

          const updatedDelivery = {
            ...order.delivery,
            ...(deliveryUpdate || {}),
          };

          addAuditLog(
            'ORDER_STATUS_UPDATED',
            `Order #${order.id} status changed from ${oldStatus} to ${newStatus}`,
            oldStatus,
            newStatus
          );

          return {
            ...order,
            orderStatus: newStatus,
            delivery: updatedDelivery,
            trackingHistory: updatedHistory,
          };
        }
        return order;
      })
    );
    return true;
  };

  // Verify Prescription (Pharmacist)
  const verifyPrescription = async (orderId: string, approved: boolean, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          prescriptionApproved: approved,
          rejectionReason: reason,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to verify prescription');
      }
    } catch (err: any) {
      console.warn('Prescription API error:', err);
      throw err;
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          if (approved) {
            addAuditLog(
              'PRESCRIPTION_VERIFIED',
              `Prescription APPROVED for Order #${order.id} by Pharmacist ${currentAdmin.name}`
            );
            return {
              ...order,
              prescriptionStatus: 'VERIFIED',
              orderStatus: 'PACKED',
            };
          } else {
            addAuditLog(
              'PRESCRIPTION_REJECTED',
              `Prescription REJECTED for Order #${order.id}. Reason: ${reason || 'Unclear doctor stamp'}`
            );
            return {
              ...order,
              prescriptionStatus: 'REJECTED',
              rejectionReason: reason || 'Invalid or unreadable prescription',
              orderStatus: 'CANCELLED',
            };
          }
        }
        return order;
      })
    );
    return true;
  };

  const getOrderById = (orderId: string) => {
    return orders.find((o) => o.id.toUpperCase() === orderId.toUpperCase().trim());
  };

  // Franchise
  const submitFranchiseInquiry = async (data: Omit<FranchiseInquiry, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    let generatedId = `FRAN-${Math.floor(100 + Math.random() * 900)}`;
    try {
      const res = await fetch('/api/franchise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.inquiryId) {
        generatedId = resData.inquiryId;
      }
    } catch (err) {
      console.warn('Franchise submit API error:', err);
    }

    const newInquiry: FranchiseInquiry = {
      ...data,
      id: generatedId,
      status: 'NEW',
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setFranchiseInquiries((prev) => [newInquiry, ...prev]);
    addAuditLog(
      'FRANCHISE_STATUS_CHANGED',
      `New Franchise application received from ${data.fullName} in ${data.city} (${data.proposedArea}).`
    );
    return generatedId;
  };

  const updateFranchiseStatus = async (
    id: string,
    status: FranchiseInquiry['status'],
    notes?: string
  ): Promise<boolean> => {
    try {
      await fetch('/api/franchise', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      });
    } catch (err) {
      console.warn('Franchise status update API issue:', err);
    }

    setFranchiseInquiries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          addAuditLog(
            'FRANCHISE_STATUS_CHANGED',
            `Franchise Lead #${id} (${item.fullName}) status updated to ${status}. Notes: ${notes || 'Updated'}`
          );
          return { ...item, status, notes: notes || item.notes };
        }
        return item;
      })
    );
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        medicines,
        totalMedicineCount,
        diagnostics,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        deliveryFee,
        cartFinalTotal,
        userPincode,
        isServiceable,
        deliveryDistanceKm,
        deliveryEstimateText,
        verifyDeliveryPincode,
        orders,
        createOrder,
        updateOrderStatus,
        verifyPrescription,
        getOrderById,
        franchiseInquiries,
        submitFranchiseInquiry,
        updateFranchiseStatus,
        discountRules,
        applyBulkDiscount,
        toggleDiscountRule,
        syncLocalWellStock,
        updateMedicineMRP,
        admins,
        currentAdmin,
        switchAdminRole,
        auditLogs,
        addAuditLog,
        currentUser,
        setCurrentUser,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        createRazorpayOrder,
        verifyRazorpayPayment,
        syncAndMergeUserCart,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
