'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  MapPin,
  Search,
  ShoppingCart,
  ShoppingBag,
  FileText,
  Truck,
  Building2,
  Lock,
  ChevronDown,
  User,
  LogOut,
  Pill,
  Activity,
  PhoneCall,
  Mail,
  X,
  Menu,
  Heart,
  Home,
  Sparkles,
} from 'lucide-react';
import PrescriptionUploadModal from './PrescriptionUploadModal';
import PincodeModal from './PincodeModal';

const CATEGORY_OPTIONS = [
  'All Categories',
  'Cardiovascular & Hematopoietic system',
  'Gastrointestinal & Hepatobiliary System',
  'Respiratory System',
  'Central Nervous System',
  'Endocrine & Metabolic System',
  'Infectious Disease Drugs',
  'Musculo-Skeletal System',
  'Personal-Care',
  'Baby-Needs',
  'Health-n-Nutrition',
  'Vitamins-n-Supplements',
  'Ayurvedic',
  'Household-Needs',
  'Diabetic-Needs',
  'Women-Care',
  'OTC-n-Health-Needs',
];

interface NavbarProps {
  isInHero?: boolean;
}

export default function Navbar({ isInHero = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    cartCount,
    cartFinalTotal,
    userPincode,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    discountRules,
    currentUser,
    signOut,
  } = useApp();

  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [wishlistCount] = useState(2); // Notification indicator matching reference
  const [prevCartCount, setPrevCartCount] = useState(cartCount);
  const [cartBouncing, setCartBouncing] = useState(false);

  // Trigger bounce animation when cart count changes
  useEffect(() => {
    if (cartCount !== prevCartCount) {
      setCartBouncing(true);
      const timer = setTimeout(() => setCartBouncing(false), 600);
      setPrevCartCount(cartCount);
      return () => clearTimeout(timer);
    }
  }, [cartCount, prevCartCount]);

  // If this instance is rendered from RootLayout and we are on the homepage,
  // skip rendering here because HomePage renders Navbar with isInHero={true}
  // inside the top of the hero container card.
  if (!isInHero && pathname === '/') {
    return null;
  }

  // Active top discount promotion
  const activeDiscount = discountRules.find((r) => r.isActive);

  const navLinks = [
    { href: '/medicines', label: 'Buy Medicines', icon: Pill, color: 'text-blue-600' },
    { href: '/blood-tests', label: 'Diagnostic Lab Tests', icon: Activity, color: 'text-teal-600' },
    { href: '/track-delivery', label: 'Track Order', icon: Truck, color: 'text-blue-600' },
    { href: '/franchise', label: 'Franchise', icon: Building2, color: 'text-amber-500' },
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pathname === '/') {
      const catalogEl = document.getElementById('catalog-section') || document.getElementById('medicines-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(`/medicines${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
    }
  };

  return (
    <>
      {/* Floating White Pill Bar Header */}
      <header
        className={`w-full transition-all duration-200 z-40 ${
          isInHero
            ? 'pt-4 sm:pt-5 px-3 sm:px-6'
            : 'sticky top-3 px-3 sm:px-6 py-2 max-w-7xl mx-auto'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-[0_10px_30px_rgba(37,99,235,0.08)] border border-white/80 flex items-center justify-between gap-2 sm:gap-4 relative">
          {/* LEFT: Logo & Location Pin */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="MedNeed Logo"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain filter hue-rotate-[65deg] brightness-105 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div>
                <div className="font-black text-lg sm:text-xl tracking-tight text-slate-900 leading-none flex items-center">
                  Med<span className="text-[#2563EB]">Need</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] ml-1 inline-block" />
                </div>
                <div className="text-[8px] sm:text-[9px] font-semibold text-slate-500 tracking-tight mt-0.5 hidden xs:block">
                  — For every need , for every life —
                </div>
              </div>
            </Link>

            {/* Location Pin */}
            <button
              type="button"
              onClick={() => setIsPincodeModalOpen(true)}
              className="hidden md:flex items-center gap-2 text-left hover:bg-blue-50/60 px-2.5 py-1.5 rounded-full transition text-xs cursor-pointer group"
              title="Change Delivery Location"
            >
              <div className="w-6 h-6 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] text-slate-400 font-medium">Select Location</div>
                <div className="font-extrabold text-[#2563EB] flex items-center gap-0.5 text-xs">
                  <span>PIN {userPincode}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* CENTER-LEFT: Home Icon Button */}
          <Link
            href="/"
            className="hidden lg:flex w-9 h-9 rounded-full border border-slate-200/90 text-slate-600 hover:text-[#2563EB] hover:border-blue-300 hover:bg-blue-50/50 items-center justify-center shrink-0 transition"
            aria-label="Home"
            title="Go to Homepage"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* CENTER: Wide Pill-Shaped Search Bar */}
          <div className="flex-1 max-w-xl mx-1 sm:mx-2 hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex items-center bg-slate-50 hover:bg-slate-100/60 focus-within:bg-white rounded-full border border-slate-200 focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-blue-500/15 transition-all px-3 py-1 text-xs">
                {/* Category Dropdown */}
                <div className="relative shrink-0 flex items-center">
                  <select
                    value={selectedCategory === 'All' ? 'All Categories' : selectedCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCategory(val === 'All Categories' ? 'All' : val);
                    }}
                    className="bg-transparent text-slate-700 font-semibold text-xs py-1.5 pr-5 pl-1 outline-none cursor-pointer appearance-none border-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
                </div>

                {/* Thin Divider */}
                <div className="h-4 w-px bg-slate-200 mx-2 shrink-0" />

                {/* Input */}
                <input
                  type="text"
                  placeholder="Search medicines, generic salts (e.g. Paracetamol), lab tests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 outline-none min-h-[34px]"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full mr-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Round Blue Search Button with White Magnifier */}
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 shadow-sm transition hover:scale-105 active:scale-95"
                  aria-label="Search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: Action Icons (Mobile search toggle, Wishlist, Cart, Profile, Hamburger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden p-2 text-slate-600 hover:text-[#2563EB] hover:bg-blue-50 rounded-full transition"
              aria-label="Toggle Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist Icon Button with Tiny Red Dot */}
            <Link
              href="/orders"
              className="relative p-2 text-slate-700 hover:text-[#2563EB] hover:bg-blue-50/60 rounded-full transition"
              aria-label="Wishlist"
              title="Saved Items"
            >
              <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            {/* Cart Icon Button with Tiny Red Dot / Count */}
            <Link
              href="/checkout"
              className={`relative p-2 text-slate-700 hover:text-[#2563EB] hover:bg-blue-50/60 rounded-full transition ${
                cartBouncing ? 'scale-110 text-[#2563EB]' : ''
              }`}
              aria-label="Shopping Cart"
              title={`Cart: ₹${cartFinalTotal.toFixed(0)}`}
            >
              <ShoppingCart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${cartBouncing ? 'animate-bounce' : ''}`} />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[9px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                  {cartCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            {/* User Account / Profile Icon */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full hover:bg-slate-100 text-slate-800 transition text-xs font-semibold"
                  aria-label="User Account"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs ring-1 ring-blue-200">
                    {currentUser.avatar || <User className="w-3.5 h-3.5" />}
                  </span>
                  <span className="hidden md:inline max-w-[80px] truncate text-xs">{currentUser.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 text-xs animate-in fade-in">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <div className="font-extrabold text-slate-900 truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                        <span className="inline-block mt-1 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          {currentUser.role.replace('_', ' ')}
                        </span>
                      </div>

                      {currentUser.role !== 'CUSTOMER' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50/70 font-semibold transition"
                        >
                          <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                          Admin Console
                        </Link>
                      )}

                      <Link
                        href="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50/70 font-semibold transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#2563EB]" />
                        My Orders
                      </Link>

                      <Link
                        href="/track-delivery"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50/70 font-semibold transition"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#2563EB]" />
                        Track Live Delivery
                      </Link>

                      <Link
                        href="/franchise"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50/70 font-semibold transition"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        Franchise Inquiries
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="p-2 text-slate-700 hover:text-[#2563EB] hover:bg-blue-50/60 rounded-full transition"
                aria-label="Sign In"
                title="Sign In"
              >
                <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </Link>
            )}

            {/* Solid Round Blue Hamburger Button with White Lines */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center justify-center shrink-0 shadow-sm transition hover:scale-105 active:scale-95"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {isMobileSearchOpen && (
          <div className="sm:hidden mt-2 px-1 animate-in fade-in">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search medicines or tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white text-xs rounded-full border border-slate-200 outline-none focus:border-[#2563EB] shadow-sm"
                autoFocus
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        )}
      </header>

      {/* Slide-over Full Navigation Drawer (opened by the blue round hamburger button) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl p-6 flex flex-col justify-between border-l border-slate-100 z-50 animate-in slide-in-from-right overflow-y-auto">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-7 h-7 object-contain filter hue-rotate-[65deg]"
                  />
                  <span className="font-black text-slate-900 text-lg">
                    Med<span className="text-[#2563EB]">Need</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Offer Banner Strip inside menu */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200/60 p-3 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#2563EB]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Storewide Health Offer</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  {activeDiscount
                    ? `${activeDiscount.title} automatically applied at checkout`
                    : 'Flat 15% OFF across medicines & diagnostic lab packages'}
                </div>
              </div>

              {/* Pincode selector button inside drawer */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsPincodeModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 text-xs font-bold text-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563EB]" />
                  <span>Deliver to: PIN {userPincode}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 tracking-wider">
                  Menu &amp; Services
                </div>
                {navLinks.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-[#2563EB] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.color}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Quick Upload Rx Pill Action */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsRxModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white p-3 rounded-xl text-xs font-extrabold shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Upload Prescription</span>
              </button>

              {/* Authentication Links */}
              <div className="pt-2 border-t border-slate-100">
                {currentUser ? (
                  <div className="space-y-1">
                    <Link
                      href="/orders"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
                      My Orders
                    </Link>
                    {currentUser.role !== 'CUSTOMER' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Lock className="w-4 h-4 text-[#2563EB]" />
                        Admin Console
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        signOut();
                        setIsMobileDrawerOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Sign In to Account</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Drawer Footer Contact Info */}
            <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-500 space-y-1.5">
              <a
                href="tel:+919437545411"
                className="flex items-center gap-1.5 font-bold text-blue-600 hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>24×7 Pharmacist: +91 94375 45411</span>
              </a>
              <a
                href="mailto:medneed.service@gmail.com"
                className="flex items-center gap-1.5 hover:text-slate-800"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>medneed.service@gmail.com</span>
              </a>
              <div className="text-[10px] text-slate-400">
                📍 Express Delivery Hub: Bhubaneswar &amp; Cuttack
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PrescriptionUploadModal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} />
      <PincodeModal isOpen={isPincodeModalOpen} onClose={() => setIsPincodeModalOpen(false)} />
    </>
  );
}
