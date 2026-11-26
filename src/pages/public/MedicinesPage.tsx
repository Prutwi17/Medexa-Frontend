import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ChevronLeft, ChevronRight, FileCheck2, Pill, Search } from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  Input,
  PageLoader,
  Select,
} from '@/components/ui';
import { resolveMediaUrl } from '@/config/env';
import { catalogApi } from '@/features/catalog/catalogApi';
import { useDebounce } from '@/hooks/useDebounce';

export function MedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [rxFilter, setRxFilter] = useState(searchParams.get('rx') ?? 'ALL');
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'createdAt,desc');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '0') || 0);

  const debouncedSearch = useDebounce(searchInput, 250);

  const categoriesQuery = useQuery({
    queryKey: ['public', 'categories'],
    queryFn: catalogApi.listPublicCategories,
  });

  const medicinesQuery = useQuery({
    queryKey: [
      'public',
      'medicines',
      { debouncedSearch, categoryId, minPrice, maxPrice, rxFilter, inStockOnly, sort, page },
    ],
    queryFn: () =>
      catalogApi.searchPublicMedicines({
        q: debouncedSearch.trim() || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStockOnly,
        prescriptionRequired:
          rxFilter === 'RX' ? true : rxFilter === 'OTC' ? false : undefined,
        sort,
        page,
        size: 12,
      }),
  });

  const syncParams = (nextPage = 0) => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('q', searchInput.trim());
    if (categoryId) next.set('categoryId', categoryId);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (rxFilter !== 'ALL') next.set('rx', rxFilter);
    if (inStockOnly) next.set('inStock', 'true');
    if (sort !== 'createdAt,desc') next.set('sort', sort);
    if (nextPage > 0) next.set('page', String(nextPage));
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    syncParams(0);
  };

  const resetFilters = () => {
    setSearchInput('');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setRxFilter('ALL');
    setInStockOnly(false);
    setSort('createdAt,desc');
    setPage(0);
    setSearchParams({});
  };

  const medicines = medicinesQuery.data?.items ?? [];
  const pagination = medicinesQuery.data?.pagination;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Medicine Catalog</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Approved prescription and OTC medicines dispensed by verified Medexa pharmacies.
          </p>
        </div>
        {pagination && (
          <Badge variant="brand">
            {pagination.totalElements} {pagination.totalElements === 1 ? 'listing' : 'listings'}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="mt-6">
        <search>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Input
                  label="Search name, brand, or composition"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(0);
                  }}
                  placeholder="e.g. Amoxicillin, Paracetamol, GSK"
                  leftAddon={<Search className="h-4 w-4" />}
                />
              </div>

              <div className="lg:col-span-3">
                <Select
                  label="Category"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(0);
                  }}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...(categoriesQuery.data ?? []).map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    })),
                  ]}
                />
              </div>

              <div className="lg:col-span-2">
                <Select
                  label="Prescription"
                  value={rxFilter}
                  onChange={(e) => {
                    setRxFilter(e.target.value);
                    setPage(0);
                  }}
                  options={[
                    { value: 'ALL', label: 'All (Rx & OTC)' },
                    { value: 'OTC', label: 'OTC Only' },
                    { value: 'RX', label: 'Prescription Required' },
                  ]}
                />
              </div>

              <div className="lg:col-span-3">
                <Select
                  label="Sort by"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(0);
                  }}
                  options={[
                    { value: 'createdAt,desc', label: 'Newest Listings' },
                    { value: 'sellingPrice,asc', label: 'Price: Low to High' },
                    { value: 'sellingPrice,desc', label: 'Price: High to Low' },
                    { value: 'name,asc', label: 'Name: A to Z' },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border-subtle pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-32">
                  <Input
                    label="Min price (₹)"
                    type="number"
                    min="0"
                    step="1"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
                <div className="w-32">
                  <Input
                    label="Max price (₹)"
                    type="number"
                    min="0"
                    step="1"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
                <label className="inline-flex min-h-11 items-center gap-2 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-surface-soft px-3.5 text-sm font-medium text-ink-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setPage(0);
                    }}
                    className="h-4 w-4 accent-brand-700"
                  />
                  <span>In stock only</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button type="submit" size="sm">
                  Apply
                </Button>
              </div>
            </div>
          </form>
        </search>
      </Card>

      {/* Results */}
      {medicinesQuery.isLoading ? (
        <PageLoader message="Loading verified pharmacy catalog..." />
      ) : medicinesQuery.isError ? (
        <AlertBanner
          className="mt-6"
          variant="error"
          title="Unable to load catalog"
          description={(medicinesQuery.error as { message?: string })?.message || 'Check backend connection.'}
        />
      ) : medicines.length === 0 ? (
        <Card className="mt-6 py-12 text-center">
          <Pill className="mx-auto h-10 w-10 text-ink-muted" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-ink-primary">No matching medicines found</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Try clearing search filters or check back once verified pharmacies publish approved listings.
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {medicines.map((med) => {
              const imageUrl = resolveMediaUrl(med.primaryImageUrl);
              return (
                <Card key={med.id} padding="none" className="flex flex-col overflow-hidden hover:border-brand-600 transition-colors">
                  <Link to={`/medicines/${med.slug}`} className="block bg-surface-soft aspect-[4/3] overflow-hidden border-b border-border-subtle">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={med.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-700/40">
                        <Pill className="h-12 w-12" aria-hidden="true" />
                      </div>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={med.prescriptionRequired ? 'warning' : 'success'}>
                        {med.prescriptionRequired ? 'Rx Required' : 'OTC'}
                      </Badge>
                      <Badge variant={med.inStock ? 'brand' : 'danger'}>
                        {med.inStock ? `${med.availableQuantity} in stock` : 'Out of stock'}
                      </Badge>
                    </div>

                    <Link to={`/medicines/${med.slug}`} className="mt-3 block">
                      <h2 className="text-base font-semibold text-ink-primary hover:text-brand-800 line-clamp-1">
                        {med.name}
                      </h2>
                    </Link>
                    <p className="text-xs font-medium text-ink-secondary">
                      {med.brand} • {med.packSize}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted line-clamp-2">{med.composition}</p>

                    <div className="mt-auto pt-4">
                      <div className="flex items-center gap-1.5 text-xs text-ink-secondary border-t border-border-subtle pt-3">
                        <Building2 className="h-3.5 w-3.5 text-brand-700 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {med.pharmacyName} ({med.pharmacyCity})
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between gap-2">
                        <div className="tabular-nums">
                          <span className="text-lg font-bold text-ink-primary">
                            ₹{med.sellingPrice.toFixed(2)}
                          </span>
                          {med.mrpPrice > med.sellingPrice && (
                            <span className="ms-2 text-xs text-ink-muted line-through">
                              ₹{med.mrpPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Link to={`/medicines/${med.slug}`}>
                          <Button size="sm" variant="outline">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <nav aria-label="Catalog pagination" className="mt-8 flex items-center justify-between border-t border-border-subtle pt-4">
              <p className="text-xs text-ink-secondary tabular-nums">
                Page {pagination.page + 1} of {pagination.totalPages} ({pagination.totalElements} items)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevious}
                  onClick={() => {
                    const next = Math.max(0, page - 1);
                    setPage(next);
                    syncParams(next);
                  }}
                  leftIcon={<ChevronLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNext}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    syncParams(next);
                  }}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      <div className="mt-8 rounded-[var(--medexa-radius-md)] border border-border-subtle bg-brand-50 p-4 text-xs text-brand-900 flex items-center gap-2.5">
        <FileCheck2 className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
        <span>
          Only medicines approved by Medexa compliance administrators from active, license-verified
          pharmacies appear in this catalog.
        </span>
      </div>
    </div>
  );
}
