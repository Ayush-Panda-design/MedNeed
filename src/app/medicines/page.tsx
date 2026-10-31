'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Search,
  Filter,
  ShieldCheck,
  Plus,
  AlertCircle,
  FileText,
  BadgePercent,
  Check,
  X,
  Sparkles,
  Clock,
  ArrowRight,
  PackageOpen,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
  Pill,
  ShoppingBag,
  Stethoscope,
  Tag,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Lock,
} from 'lucide-react';
import PrescriptionUploadModal from '@/components/PrescriptionUploadModal';
import MedicineCard from '@/components/medicines/MedicineCard';
import MedicineQuickViewDrawer from '@/components/medicines/MedicineQuickViewDrawer';
import { MedicineCardSkeletonGrid } from '@/components/medicines/MedicineCardSkeleton';
import { DosageFormIcon, FloatingPillsHero } from '@/components/ui/Illustrations';
import {
  PHARMACY_THERAPEUTIC_CATEGORIES,
  GENERAL_STORE_SECTIONS,
  ALPHABET_DIRECTORY,
} from '@/data/categoriesData';
import { Medicine } from '@/types';

// Top Department Nav Options
const DEPARTMENT_TABS = [
  { id: 'ALL', label: 'All Products', icon: '✚' },
  { id: 'Pharmacy', label: 'Prescription & Pharmacy', icon: '💊' },
  { id: 'General Store', label: 'General Store & Wellness', icon: '🛍️' },
  { id: 'OTC', label: 'OTC Health Needs', icon: '⚡' },
  { id: 'Ayurvedic', label: 'Ayurvedic & Herbal', icon: '🌿' },
  { id: 'Vitamins', label: 'Vitamins & Supplements', icon: '✦' },
];

const DOSAGE_FORMS = [
  'All',
  'Tablet',
  'Capsule',
  'Syrup',
  'Gel',
  'Drops',
  'Inhaler',
  'Injection',
  'Lotion',
  'Powder',
  'Sachet',
];

const SORT_OPTIONS = [
  { id: 'name_asc', label: 'Name: A to Z' },
  { id: 'name_desc', label: 'Name: Z to A' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'discount_desc', label: 'Biggest Discount' },
];

function MedicinesCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    medicines,
    totalMedicineCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    addToCart,
    discountRules,
  } = useApp();

  // URL Query Parameters Parsing
  const urlCategory = searchParams.get('category');
  const urlSubCategory = searchParams.get('subCategory');
  const urlTherapeutic = searchParams.get('therapeutic');
  const urlDepartment = searchParams.get('department');
  const urlLetter = searchParams.get('letter');
  const urlDosage = searchParams.get('dosage');
  const urlRx = searchParams.get('rx');
  const urlSymptom = searchParams.get('symptom');
  const urlSort = searchParams.get('sort');

  // Filter States
  const [activeDepartment, setActiveDepartment] = useState<string>(urlDepartment || 'ALL');
  const [selectedTherapeutic, setSelectedTherapeutic] = useState<string>(urlTherapeutic || 'All');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(urlSubCategory || 'All');
  const [selectedLetter, setSelectedLetter] = useState<string>(urlLetter || 'ALL');
  const [selectedDosage, setSelectedDosage] = useState<string>(urlDosage || 'All');
  const [filterRxOnly, setFilterRxOnly] = useState<boolean | null>(
    urlRx === 'true' ? true : urlRx === 'false' ? false : null
  );
  const [selectedSymptom, setSelectedSymptom] = useState<string>(urlSymptom || '');
  const [selectedSort, setSelectedSort] = useState<string>(urlSort || 'name_asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500]);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Accordion Toggles for Sidebar
  const [isTherapeuticOpen, setIsTherapeuticOpen] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isDosageOpen, setIsDosageOpen] = useState(true);
  const [isPriceOpen, setIsPriceOpen] = useState(true);

  // Mobile Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // UI state
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Quick View Drawer State
  const [quickViewMed, setQuickViewMed] = useState<Medicine | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quickViewTab, setQuickViewTab] = useState<'details' | 'substitutes'>('details');

  const handleOpenQuickView = (med: Medicine, initialTab: 'details' | 'substitutes' = 'details') => {
    setQuickViewMed(med);
    setQuickViewTab(initialTab);
    setIsQuickViewOpen(true);
  };

  // Pagination
  const [pageSize, setPageSize] = useState<number>(24);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync state if URL query params change (e.g. from footer links)
  useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
    if (urlSubCategory) setSelectedSubCategory(urlSubCategory);
    if (urlTherapeutic) setSelectedTherapeutic(urlTherapeutic);
    if (urlDepartment) setActiveDepartment(urlDepartment);
    if (urlLetter) setSelectedLetter(urlLetter.toUpperCase());
    if (urlDosage) setSelectedDosage(urlDosage);
    if (urlRx !== null) setFilterRxOnly(urlRx === 'true' ? true : urlRx === 'false' ? false : null);
    if (urlSymptom) setSelectedSymptom(urlSymptom);
    if (urlSort) setSelectedSort(urlSort);
  }, [
    urlCategory,
    urlSubCategory,
    urlTherapeutic,
    urlDepartment,
    urlLetter,
    urlDosage,
    urlRx,
    urlSymptom,
    urlSort,
    setSelectedCategory,
  ]);

  const activeDiscount = discountRules.find((r) => r.isActive);

  // Main Advanced Filtering Logic
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      // 1. Department Filter
      if (activeDepartment !== 'ALL') {
        if (activeDepartment === 'Pharmacy' && med.department && med.department !== 'Pharmacy') return false;
        if (activeDepartment === 'General Store' && med.department && med.department !== 'General Store') return false;
        if (activeDepartment === 'OTC' && med.requiresPrescription) return false;
        if (activeDepartment === 'Ayurvedic' && !med.category.toLowerCase().includes('ayurvedic')) return false;
        if (activeDepartment === 'Vitamins' && !med.category.toLowerCase().includes('vitamin')) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'All') {
        const catNorm = selectedCategory.toLowerCase().replace(/[-_]/g, ' ');
        const medCatNorm = med.category.toLowerCase().replace(/[-_]/g, ' ');
        const matchesCategory =
          medCatNorm === catNorm ||
          medCatNorm.includes(catNorm) ||
          (med.therapeuticCategory && med.therapeuticCategory.toLowerCase().replace(/[-_]/g, ' ').includes(catNorm));
        if (!matchesCategory) return false;
      }

      // 3. SubCategory Filter
      if (selectedSubCategory !== 'All') {
        const subNorm = selectedSubCategory.toLowerCase().replace(/[-_]/g, ' ');
        const medSubNorm = med.subCategory?.toLowerCase().replace(/[-_]/g, ' ') || '';
        const medClassNorm = med.therapeuticClass?.toLowerCase().replace(/[-_]/g, ' ') || '';
        if (!medSubNorm.includes(subNorm) && !medClassNorm.includes(subNorm)) return false;
      }

      // 4. Therapeutic Category Filter
      if (selectedTherapeutic !== 'All') {
        const thNorm = selectedTherapeutic.toLowerCase().replace(/[-_]/g, ' ');
        const medThNorm = med.therapeuticCategory?.toLowerCase().replace(/[-_]/g, ' ') || '';
        const medCatNorm = med.category.toLowerCase().replace(/[-_]/g, ' ');
        if (!medThNorm.includes(thNorm) && !medCatNorm.includes(thNorm)) return false;
      }

      // 5. Alphabet (A-Z) Filter
      if (selectedLetter !== 'ALL') {
        const trimmedName = med.name.trim();
        if (selectedLetter === '0-9') {
          if (!/^[0-9]/.test(trimmedName)) return false;
        } else {
          if (!trimmedName.toUpperCase().startsWith(selectedLetter)) return false;
        }
      }

      // 6. Dosage Form Filter
      if (selectedDosage !== 'All') {
        if (med.dosageForm.toLowerCase() !== selectedDosage.toLowerCase()) return false;
      }

      // 7. Rx / OTC Filter
      if (filterRxOnly !== null) {
        if (med.requiresPrescription !== filterRxOnly) return false;
      }

      // 8. Symptom Filter
      if (selectedSymptom) {
        const symNorm = selectedSymptom.toLowerCase().replace(/[-_]/g, ' ');
        const matchesSymptom =
          med.symptoms?.some((s) => s.toLowerCase().replace(/[-_]/g, ' ').includes(symNorm)) ||
          med.description.toLowerCase().includes(symNorm);
        if (!matchesSymptom) return false;
      }

      // 9. Price Range
      if (med.sellingPrice < priceRange[0] || med.sellingPrice > priceRange[1]) return false;

      // 10. Discount Filter
      if (minDiscount > 0 && med.discountPercentage < minDiscount) return false;

      // 11. In-Stock Filter
      if (inStockOnly && med.stockQty <= 0) return false;

      // 12. Search Query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesSearch =
          med.name.toLowerCase().includes(q) ||
          med.salt.toLowerCase().includes(q) ||
          med.brand.toLowerCase().includes(q) ||
          med.localWellCode.toLowerCase().includes(q) ||
          med.description.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [
    medicines,
    activeDepartment,
    selectedCategory,
    selectedSubCategory,
    selectedTherapeutic,
    selectedLetter,
    selectedDosage,
    filterRxOnly,
    selectedSymptom,
    priceRange,
    minDiscount,
    inStockOnly,
    searchQuery,
  ]);

  // Sort Filtered Medicines
  const sortedMedicines = useMemo(() => {
    const list = [...filteredMedicines];
    if (selectedSort === 'price_asc') {
      list.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (selectedSort === 'price_desc') {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else if (selectedSort === 'discount_desc') {
      list.sort((a, b) => b.discountPercentage - a.discountPercentage);
    } else if (selectedSort === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // Default: name_asc
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredMedicines, selectedSort]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeDepartment,
    selectedCategory,
    selectedSubCategory,
    selectedTherapeutic,
    selectedLetter,
    selectedDosage,
    filterRxOnly,
    selectedSymptom,
    selectedSort,
    priceRange,
    minDiscount,
    inStockOnly,
    searchQuery,
    pageSize,
  ]);

  // Reset all filters function
  const handleResetFilters = () => {
    setActiveDepartment('ALL');
    setSelectedCategory('All');
    setSelectedSubCategory('All');
    setSelectedTherapeutic('All');
    setSelectedLetter('ALL');
    setSelectedDosage('All');
    setFilterRxOnly(null);
    setSelectedSymptom('');
    setSearchQuery('');
    setPriceRange([0, 1500]);
    setMinDiscount(0);
    setInStockOnly(false);
    setSelectedSort('name_asc');
    router.push('/medicines');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeDepartment !== 'ALL') count++;
    if (selectedCategory !== 'All') count++;
    if (selectedSubCategory !== 'All') count++;
    if (selectedTherapeutic !== 'All') count++;
    if (selectedLetter !== 'ALL') count++;
    if (selectedDosage !== 'All') count++;
    if (filterRxOnly !== null) count++;
    if (selectedSymptom) count++;
    if (searchQuery) count++;
    if (minDiscount > 0) count++;
    if (inStockOnly) count++;
    if (priceRange[0] > 0 || priceRange[1] < 1500) count++;
    return count;
  }, [
    activeDepartment,
    selectedCategory,
    selectedSubCategory,
    selectedTherapeutic,
    selectedLetter,
    selectedDosage,
    filterRxOnly,
    selectedSymptom,
    searchQuery,
    minDiscount,
    inStockOnly,
    priceRange,
  ]);

  const totalItems = sortedMedicines.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedMedicines = sortedMedicines.slice(startIdx, startIdx + pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleAdd = (med: Medicine) => {
    if (med.schedule === 'SCHEDULE_X') {
      alert(
        `Schedule X Controlled Substance: "${med.name}" cannot be added to cart. Under Indian Pharmacy Regulations (Drugs & Cosmetics Act, Rules 65 & 97), Schedule X narcotics and psychotropics are strictly prohibited from online sale. They must be purchased in person at a licensed pharmacy with a physical duplicate prescription.`
      );
      return;
    }

    addToCart({
      id: med.id,
      title: med.name,
      type: 'MEDICINE',
      mrp: med.mrp,
      sellingPrice: med.sellingPrice,
      quantity: 1,
      requiresPrescription: med.requiresPrescription,
      schedule: med.schedule,
      batchNumber: med.batchNumber,
      category: med.category,
    });
    setToastMsg(`${med.name} added to cart`);
    setAddedIds((prev) => ({ ...prev, [med.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [med.id]: false }));
    }, 1800);
    setTimeout(() => setToastMsg(null), 2200);
  };

  // Reusable Sidebar Filter Content (used for both desktop sidebar and mobile drawer)
  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* Header & Clear Filter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          <span>Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Prescription / Regulatory Schedule */}
      <div className="space-y-2">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
          Prescription Requirement
        </span>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterRxOnly(null)}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
              filterRxOnly === null
                ? 'bg-slate-900 text-white shadow-soft-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterRxOnly(false)}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
              filterRxOnly === false
                ? 'bg-emerald-600 text-white shadow-soft-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OTC Only
          </button>
          <button
            onClick={() => setFilterRxOnly(true)}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition ${
              filterRxOnly === true
                ? 'bg-rose-600 text-white shadow-soft-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rx Only
          </button>
        </div>
      </div>

      {/* Accordion 1: Therapeutic Categories */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setIsTherapeuticOpen(!isTherapeuticOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-extrabold text-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Pill className="w-3.5 h-3.5 text-emerald-600" />
            <span>Therapeutic System</span>
          </span>
          {isTherapeuticOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isTherapeuticOpen && (
          <div className="p-3 max-h-56 overflow-y-auto space-y-1 text-xs">
            <button
              onClick={() => setSelectedTherapeutic('All')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold transition flex items-center justify-between text-[11px] ${
                selectedTherapeutic === 'All'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Therapeutic Systems</span>
              <span className="text-[10px] text-slate-400">{medicines.length}</span>
            </button>
            {PHARMACY_THERAPEUTIC_CATEGORIES.map((th) => {
              const isSelected = selectedTherapeutic === th.name;
              const count = medicines.filter(
                (m) =>
                  m.therapeuticCategory === th.name ||
                  m.category.toLowerCase().includes(th.slug.split('-')[0])
              ).length;

              return (
                <button
                  key={th.name}
                  onClick={() => setSelectedTherapeutic(isSelected ? 'All' : th.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between text-[11px] ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-extrabold shadow-soft-sm'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{th.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion 2: General Store & Subcategories */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-extrabold text-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            <span>Store Categories</span>
          </span>
          {isCategoryOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isCategoryOpen && (
          <div className="p-3 max-h-56 overflow-y-auto space-y-1 text-xs">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg font-bold transition flex items-center justify-between text-[11px] ${
                selectedCategory === 'All'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>All Categories</span>
              <span className="text-[10px] text-slate-400">{medicines.length}</span>
            </button>
            {GENERAL_STORE_SECTIONS.map((sec) => {
              const isSelected = selectedCategory === sec.name;
              const count = medicines.filter(
                (m) =>
                  m.category === sec.name ||
                  m.category.toLowerCase().includes(sec.slug.replace(/-/g, ' '))
              ).length;

              return (
                <button
                  key={sec.name}
                  onClick={() => setSelectedCategory(isSelected ? 'All' : sec.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition flex items-center justify-between text-[11px] ${
                    isSelected
                      ? 'bg-amber-500 text-white font-extrabold shadow-soft-sm'
                      : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span className="truncate pr-2">{sec.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion 3: Dosage Form */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setIsDosageOpen(!isDosageOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-extrabold text-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Dosage Form</span>
          </span>
          {isDosageOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isDosageOpen && (
          <div className="p-3 flex flex-wrap gap-1.5">
            {DOSAGE_FORMS.map((form) => {
              const isSelected = selectedDosage === form;
              return (
                <button
                  key={form}
                  onClick={() => setSelectedDosage(isSelected ? 'All' : form)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-soft-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {form}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion 4: Price & Discount Filter */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="w-full flex items-center justify-between p-3.5 text-xs font-extrabold text-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-purple-500" />
            <span>Price &amp; Discounts</span>
          </span>
          {isPriceOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isPriceOpen && (
          <div className="p-3.5 space-y-4 text-xs">
            {/* Quick Price Bands */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Max Price: ₹{priceRange[1]}
              </span>
              <input
                type="range"
                min="30"
                max="1500"
                step="20"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value, 10)])}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>₹0</span>
                <span>₹750</span>
                <span>₹1500+</span>
              </div>
            </div>

            {/* Discount Filter */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                Minimum Discount
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[0, 10, 15, 20].map((disc) => (
                  <button
                    key={disc}
                    onClick={() => setMinDiscount(disc)}
                    className={`py-1 text-[10px] font-bold rounded-lg border transition ${
                      minDiscount === disc
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {disc === 0 ? 'All' : `${disc}%+`}
                  </button>
                ))}
              </div>
            </div>

            {/* In-stock toggle */}
            <label className="flex items-center gap-2 pt-2 border-t border-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 accent-emerald-600"
              />
              <span className="text-[11px] font-bold text-slate-700">In Stock Formulations Only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5]/50 via-[#FAF8F5] to-white py-8 px-4 sm:px-6 lg:px-8 space-y-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0B1F17] text-white px-5 py-3 rounded-full shadow-soft-xl flex items-center gap-2.5 border border-emerald-500/40 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
        )}

        {/* Header Hero Banner with Glowing Accent & Floating SVGs */}
        <div className="relative bg-gradient-to-r from-[#0B1F17] via-[#0F5132] to-[#071F14] text-white rounded-3xl p-6 sm:p-10 shadow-soft-xl overflow-hidden border border-emerald-800/60">
          <div className="absolute inset-0 bg-pattern-cross opacity-10 pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-96 h-96 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />

          {/* Floating Pill SVG in banner corner */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 h-40 hidden md:block opacity-70 pointer-events-none">
            <FloatingPillsHero />
          </div>

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MedNeed Enterprise Pharmacy Directory</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Medicine Catalog &amp; Healthcare Directory
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Explore 30,000+ verified medicines classified by therapeutic organ systems, generic salts, manufacturer brands, and DPCO-regulated retail pricing.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsRxModalOpen(true)}
                className="btn-primary-gradient font-black px-5 py-3 rounded-full text-xs sm:text-sm inline-flex items-center gap-2 shadow-soft hover:scale-105 transition duration-200 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>Upload Prescription</span>
                <span className="w-2 h-2 rounded-full bg-amber-300 pulsing-dot ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* 1. Department Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DEPARTMENT_TABS.map((tab) => {
            const isSelected = activeDepartment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveDepartment(tab.id);
                  setSelectedCategory('All');
                  setSelectedTherapeutic('All');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-2 shadow-2xs ${
                  isSelected
                    ? 'btn-primary-gradient text-white shadow-soft scale-102 ring-2 ring-emerald-400/50'
                    : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-950 border border-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. Alphabet-Wise Directory Bar (A-Z) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <span className="text-emerald-600 font-black">A–Z</span> Alphabetical Drug Directory:
            </span>
            {selectedLetter !== 'ALL' && (
              <button
                onClick={() => setSelectedLetter('ALL')}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Letter Filter
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {ALPHABET_DIRECTORY.map((letter) => {
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(isSelected ? 'ALL' : letter)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-black font-mono transition shrink-0 cursor-pointer ${
                    isSelected
                      ? 'btn-primary-gradient text-white shadow-soft-sm scale-110'
                      : 'bg-slate-50 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Sticky Search, Sort & Mobile Controls Bar */}
        <div className="sticky top-20 z-30 glass-card rounded-2xl p-3 sm:p-4 border border-emerald-200/80 shadow-soft space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-8 relative group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by brand (e.g. Dolo, Pan-D, Augmentin) or composition (e.g. Paracetamol, Metformin)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-full focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition shadow-soft-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Mobile Filter Toggle */}
            <div className="md:col-span-4 flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="w-full py-2.5 pl-3 pr-8 text-xs font-bold bg-white border border-slate-200 rounded-full text-slate-700 shadow-soft-sm appearance-none outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Mobile Filter Drawer Trigger */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden px-4 py-2.5 rounded-full text-xs font-extrabold bg-slate-900 text-white flex items-center gap-1.5 shadow-soft cursor-pointer shrink-0"
              >
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Badges Strip */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-slate-400 text-[11px] font-bold">Active:</span>

              {activeDepartment !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Dept: {activeDepartment}
                  <button onClick={() => setActiveDepartment('ALL')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTherapeutic !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Therapeutic: {selectedTherapeutic}
                  <button onClick={() => setSelectedTherapeutic('All')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('All')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubCategory !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Sub: {selectedSubCategory}
                  <button onClick={() => setSelectedSubCategory('All')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedLetter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                  Starts with: {selectedLetter}
                  <button onClick={() => setSelectedLetter('ALL')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedDosage !== 'All' && (
                <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Form: {selectedDosage}
                  <button onClick={() => setSelectedDosage('All')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {filterRxOnly !== null && (
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {filterRxOnly ? 'Rx Only' : 'OTC Only'}
                  <button onClick={() => setFilterRxOnly(null)} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSymptom && (
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Symptom: {selectedSymptom}
                  <button onClick={() => setSelectedSymptom('')} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {minDiscount > 0 && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Min {minDiscount}% Off
                  <button onClick={() => setMinDiscount(0)} className="hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline pl-2 cursor-pointer"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* 4. MAIN DUAL-PANE LAYOUT: Desktop Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* DESKTOP SIDEBAR FILTER (Hidden on Mobile) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-36 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft">
              <FilterSidebarContent />
            </div>
          </aside>

          {/* MAIN PRODUCTS DISPLAY (lg:col-span-9) */}
          <main className="lg:col-span-9 space-y-5">
            {/* Results Info & Items Per Page */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pb-1">
              <div>
                Showing <strong className="text-slate-900">{totalItems === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + pageSize, totalItems)}</strong> of{' '}
                <strong className="text-slate-900">{totalItems.toLocaleString('en-IN')}</strong> verified products
              </div>

              <div className="flex items-center gap-4">
                {activeDiscount && (
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <BadgePercent className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{activeDiscount.title} active</span>
                  </div>
                )}

                {/* Items Per Page */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-bold text-[11px]">Show:</span>
                  <div className="inline-flex rounded-full bg-white p-0.5 border border-slate-200 shadow-soft-sm">
                    {[12, 24, 48].map((size) => (
                      <button
                        key={size}
                        onClick={() => setPageSize(size)}
                        className={`px-2.5 py-1 rounded-full text-xs font-black transition cursor-pointer ${
                          pageSize === size
                            ? 'btn-primary-gradient text-white shadow-soft-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {totalItems === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <PackageOpen className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900">No matching products found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  We could not find products matching your current combination of filters. Try clearing some filters or searching for general salts like &ldquo;Paracetamol&rdquo;, &ldquo;Pantoprazole&rdquo;, or &ldquo;Amoxicillin&rdquo;.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="btn-primary-gradient text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-soft"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Product Cards Grid: 4 columns on wide desktop, 3 on laptop, 2 on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
              {paginatedMedicines.map((med) => (
                <MedicineCard
                  key={med.id}
                  medicine={med}
                  isAdded={!!addedIds[med.id]}
                  onAdd={handleAdd}
                  onQuickView={handleOpenQuickView}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 mt-6">
                <div className="text-xs text-slate-500 font-medium">
                  Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
                  <strong className="text-slate-900">{totalPages}</strong> ({totalItems} verified medicines)
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 220, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shadow-soft-sm"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-slate-400 font-bold text-xs select-none"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => {
                            setCurrentPage(Number(page));
                            window.scrollTo({ top: 220, behavior: 'smooth' });
                          }}
                          className={`w-9 h-9 rounded-full text-xs font-black transition flex items-center justify-center cursor-pointer ${
                            currentPage === page
                              ? 'btn-primary-gradient text-white shadow-soft font-black'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 220, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer shadow-soft-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Slide-Out Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto space-y-6 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-black text-slate-900 text-sm">Filters</span>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <FilterSidebarContent />

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full btn-primary-gradient text-white font-extrabold py-3 rounded-full text-xs shadow-soft"
              >
                Apply &amp; View {totalItems} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Drawer */}
      <MedicineQuickViewDrawer
        isOpen={isQuickViewOpen}
        medicine={quickViewMed}
        catalogMedicines={medicines}
        initialTab={quickViewTab}
        onClose={() => setIsQuickViewOpen(false)}
        onAdd={handleAdd}
        onUploadRx={() => setIsRxModalOpen(true)}
        isAdded={quickViewMed ? !!addedIds[quickViewMed.id] : false}
      />

      <PrescriptionUploadModal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} />
    </div>
  );
}

export default function MedicinesCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-[#ECFDF5]/50 via-[#FAF8F5] to-white py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="h-44 bg-slate-200/60 rounded-3xl animate-pulse" />
          <MedicineCardSkeletonGrid count={8} />
        </div>
      }
    >
      <MedicinesCatalogContent />
    </Suspense>
  );
}
