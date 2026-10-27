import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { FoodCategory, FoodDonation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MapComponent } from '../components/MapComponent';
import { 
  Search, Filter, Map, Grid, Clock, MapPin, 
  Sparkles, AlertCircle, ArrowUpDown, ShieldCheck 
} from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expiringSoonOnly, setExpiringSoonOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadMarketplace();
  }, [selectedCategory, selectedDietary, expiringSoonOnly]);

  const loadCategories = async () => {
    try {
      const res = await apiClient.get('/donations/categories/');
      setCategories(res.data.results || res.data || []);
    } catch (e) {}
  };

  const loadMarketplace = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDietary) params.dietary = selectedDietary;
      if (expiringSoonOnly) params.urgency = 'expiring_soon';
      if (searchQuery) params.search = searchQuery;

      // Provide San Francisco coordinates by default to compute relative distance
      params.lat = 37.7749;
      params.lon = -122.4194;

      const res = await apiClient.get('/donations/listings/marketplace/', { params });
      setDonations(res.data.results || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarketplace();
  };

  const filteredDonations = donations.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.donor.organization_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
            Open Food Exchange
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">Food Redistribution Marketplace</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time surplus listings from verified food businesses ready for immediate community claiming.
          </p>
        </div>

        {/* View Toggle (Grid vs Map) */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid View</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'map' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by meal title, ingredient, or donor kitchen..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
              selectedCategory === ''
                ? 'bg-forest-700 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(selectedCategory === String(c.id) ? '' : String(c.id))}
              className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                selectedCategory === String(c.id)
                  ? 'bg-forest-700 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Dietary & Urgency Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-500">Dietary:</span>
            {['VEG', 'VEGAN', 'HALAL', 'NON_VEG'].map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDietary(selectedDietary === d ? '' : d)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  selectedDietary === d
                    ? 'border-forest-600 bg-forest-50 text-forest-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d === 'NON_VEG' ? 'Non-Veg' : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 select-none">
            <input
              type="checkbox"
              checked={expiringSoonOnly}
              onChange={(e) => setExpiringSoonOnly(e.target.checked)}
              className="rounded text-forest-700 focus:ring-forest-600 w-3.5 h-3.5"
            />
            <span className="flex items-center gap-1 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span>Expiring Soon (&lt; 6h)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Main Content Area: Grid or Map */}
      {loading ? (
        <div className="py-24 text-center text-xs text-gray-400">Loading live marketplace items...</div>
      ) : filteredDonations.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No matching food donations found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your category or dietary filters, or check back soon as kitchens post fresh batches.
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[550px] w-full">
          <MapComponent donations={filteredDonations} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonations.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 hover:border-forest-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                    {item.category.name}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm group-hover:text-forest-700 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || 'Verified food surplus prepared under strict safety guidelines.'}
                  </p>
                </div>

                {/* Donor and Location */}
                <div className="space-y-1 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-gray-700 font-medium">
                    <span className="truncate">{item.donor.organization_name}</span>
                    {item.donor.is_verified && (
                      <span className="text-emerald-700 flex items-center gap-0.5 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{item.pickup_address}</span>
                    </span>
                    {item.distance_km !== undefined && (
                      <span className="font-semibold text-gray-600">{item.distance_km} km away</span>
                    )}
                  </div>
                </div>

                {/* Times & Allergens */}
                <div className="bg-[#f8faf9] p-2.5 rounded-xl text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Pickup Window:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(item.pickup_window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash;{' '}
                      {new Date(item.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.allergens && (
                    <div className="text-[10px] text-amber-700 truncate">
                      <span className="font-semibold">Allergens:</span> {item.allergens}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Quantity</span>
                  <span className="text-xs font-extrabold text-gray-900">
                    {item.quantity} {item.quantity_unit} (~{item.estimated_meals} meals)
                  </span>
                </div>

                <Link
                  to={`/donations/${item.id}`}
                  className="px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
                >
                  View Listing &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

