import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FoodCategory, AIAnalysisResult } from '../types';
import { 
  Sparkles, Upload, AlertTriangle, CheckCircle2, 
  ShieldCheck, Clock, FileText, Scale 
} from 'lucide-react';

export const CreateDonationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [donorNotes, setDonorNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [estimatedMeals, setEstimatedMeals] = useState<number>(20);
  const [dietaryType, setDietaryType] = useState('VEG');
  const [allergens, setAllergens] = useState('');
  const [storageCondition, setStorageCondition] = useState('ROOM_TEMP');
  const [storageTemp, setStorageTemp] = useState<number | ''>('');
  const [packagingDetails, setPackagingDetails] = useState('Food-grade containers');
  const [pickupStart, setPickupStart] = useState('');
  const [pickupEnd, setPickupEnd] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '123 Market Street, San Francisco');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/donations/categories/').then((res) => {
      const cats = res.data.results || res.data || [];
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0].id);
    });

    // Default dates (e.g. today starting now, ending in 4 hours, expiry in 8 hours)
    const now = new Date();
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in5h = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const in10h = new Date(now.getTime() + 10 * 60 * 60 * 1000);

    const toLocalISO = (d: Date) => d.toISOString().slice(0, 16);
    setPickupStart(toLocalISO(in1h));
    setPickupEnd(toLocalISO(in5h));
    setExpiryTime(toLocalISO(in10h));
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAIAnalyze = async () => {
    setAnalyzing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      formData.append('notes', donorNotes || title);

      const res = await apiClient.post('/ai/analyze-food/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const analysis: AIAnalysisResult = res.data;
      setAiResult(analysis);

      // Auto-fill form fields with AI suggestions for human review
      if (analysis.suggested_title) setTitle(analysis.suggested_title);
      if (analysis.suggested_description) setDescription(analysis.suggested_description);
      if (analysis.category_id) setCategoryId(analysis.category_id);
      if (analysis.suggested_dietary) setDietaryType(analysis.suggested_dietary);
    } catch (err: any) {
      setErrorMsg('AI Assistant was unable to process the image. You may fill the fields manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title,
        category: categoryId,
        description,
        quantity: Number(quantity),
        quantity_unit: quantityUnit,
        estimated_meals: Number(estimatedMeals),
        pickup_window_start: new Date(pickupStart).toISOString(),
        pickup_window_end: new Date(pickupEnd).toISOString(),
        expiry_time: new Date(expiryTime).toISOString(),
        dietary_type: dietaryType,
        allergens,
        storage_condition: storageCondition,
        storage_temperature_celsius: storageTemp === '' ? null : Number(storageTemp),
        packaging_details: packagingDetails,
        pickup_address: pickupAddress,
        special_instructions: specialInstructions,
      };

      const res = await apiClient.post('/donations/listings/', payload);
      const createdId = res.data.id;

      // Upload image if provided
      if (selectedImage && createdId) {
        try {
          const imgFormData = new FormData();
          imgFormData.append('image', selectedImage);
          imgFormData.append('caption', title);
          await apiClient.post(`/donations/listings/${createdId}/upload_image/`, imgFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (imgErr) {}
      }

      navigate(`/donations/${createdId}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to publish listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
          Photo-Assisted Food Listing Assistant
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
          Create Food Donation Listing
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Upload a food photo to auto-generate listing drafts. All safety data requires human review.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: AI Assistant Photo Upload & Analysis */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-bold text-gray-900">Step 1: AI Visual Listing Assistant</h2>
        </div>
        <p className="text-xs text-gray-500">
          Upload a photograph of prepared surplus meals or bakery items. The assistant will detect category, estimate portions, and suggest draft copy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-200 hover:border-forest-400 rounded-2xl p-6 text-center space-y-3 transition-colors flex flex-col items-center justify-center min-h-[180px]">
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Food Preview"
                  className="w-32 h-32 object-cover rounded-xl mx-auto shadow-xs border border-gray-200"
                />
                <label className="text-xs text-forest-700 font-semibold hover:underline cursor-pointer block">
                  Change photo
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer space-y-2 block">
                <div className="w-10 h-10 rounded-2xl bg-forest-50 text-forest-700 mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Upload Food Photograph</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">JPEG, PNG or WebP up to 5MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            )}
          </div>

          {/* Quick Notes for AI */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kitchen Notes or Ingredients (Optional)
              </label>
              <textarea
                rows={3}
                value={donorNotes}
                onChange={(e) => setDonorNotes(e.target.value)}
                placeholder="e.g. Vegetarian Mediterranean pasta with tomato sauce, cooked 2 hours ago in hotel kitchen."
                className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <button
              type="button"
              onClick={handleAIAnalyze}
              disabled={analyzing}
              className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{analyzing ? 'Analyzing with AI...' : 'Generate Listing with AI'}</span>
            </button>
          </div>
        </div>

        {/* AI Suggestions Card & Mandatory Safety Notice */}
        {aiResult && (
          <div className="mt-4 p-4 rounded-2xl bg-forest-50/70 border border-forest-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI Generated Suggestions Applied ({aiResult.provider})
              </span>
              <span className="text-[10px] font-semibold text-forest-700 uppercase bg-white px-2 py-0.5 rounded border border-forest-200">
                Portion Range: {aiResult.estimated_quantity_range}
              </span>
            </div>

            {/* Critical Safety Notice Callout */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-bold">MANDATORY FOOD SAFETY NOTICE:</strong> {aiResult.safety_disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Human Confirmation & Listing Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <FileText className="w-5 h-5 text-forest-700" />
          <h2 className="text-sm font-bold text-gray-900">Step 2: Confirm & Verify Listing Details</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Donation Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fresh Sourdough Loaves & Croissant Assortment"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Food Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dietary Classification *</label>
              <select
                value={dietaryType}
                onChange={(e) => setDietaryType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="VEG">Vegetarian</option>
                <option value="VEGAN">Vegan</option>
                <option value="HALAL">Halal</option>
                <option value="NON_VEG">Non-Vegetarian</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Listing Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe dishes, ingredients, preparation and packaging..."
              className="w-full p-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Weight / Quantity *</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                required
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQuantity(val);
                  setEstimatedMeals(Math.round(val * 2.2));
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Unit of Measure</label>
              <select
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="portions">Portions / Meals</option>
                <option value="crates">Crates / Boxes</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Estimated Meals Provided</label>
              <input
                type="number"
                min="1"
                required
                value={estimatedMeals}
                onChange={(e) => setEstimatedMeals(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Safety & Storage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Storage Condition *</label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                <option value="AMBIENT">Ambient / Room Temp</option>
                <option value="REFRIGERATED">Refrigerated (0 - 4°C)</option>
                <option value="FROZEN">Frozen (-18°C or below)</option>
                <option value="HOT_HOLDING">Hot Holding (&gt; 63°C)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Storage Temp (°C)</label>
              <input
                type="number"
                value={storageTemp}
                onChange={(e) => setStorageTemp(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 3.5"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Declared Allergens</label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="e.g. Gluten, Dairy, Peanuts"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          {/* Timing Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pickup Window Start *</label>
              <input
                type="datetime-local"
                required
                value={pickupStart}
                onChange={(e) => setPickupStart(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Pickup Window End *</label>
              <input
                type="datetime-local"
                required
                value={pickupEnd}
                onChange={(e) => setPickupEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Safe Expiry Deadline *</label>
              <input
                type="datetime-local"
                required
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Pickup Street Address *</label>
            <input
              type="text"
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Pickup & Loading Instructions</label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Enter through kitchen back alley, ask for chef on duty."
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            By publishing, you confirm food safety standards and allergen disclosures.
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing Listing...' : 'Publish to Marketplace'}
          </button>
        </div>
      </form>
    </div>
  );
};

