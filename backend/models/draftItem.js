import mongoose from 'mongoose';

const DraftItemSchema = new mongoose.Schema(
  {
    // Basic item information
    itemId: { type: String, required: true, unique: true },
    name: String,
    brand: String,
    make: String,
    model: String,
    serialNumber: String,
    type: String,
    description: String,
    category: String,
    subcategory: String,
    style: String,
    vintage: Boolean,
    antique: Boolean,
    rarity: String,
    packagingAccessoriesIncluded: String,
    materialComposition: String,

    // Clothing measurements
    clothingMeasurementsSizeLabel: String,
    clothingMeasurementsChestBust: String,
    clothingMeasurementsWaist: String,
    clothingMeasurementsHips: String,
    clothingMeasurementsShoulderWidth: String,
    clothingMeasurementsSleeveLength: String,
    clothingMeasurementsInseam: String,
    clothingMeasurementsTotalLength: String,

    // Footwear measurements
    footwearMeasurementsSize: String,
    footwearMeasurementsWidth: String,
    footwearMeasurementsInsoleLength: String,
    footwearMeasurementsHeelHeight: String,
    footwearMeasurementsPlatformHeight: String,
    footwearMeasurementsBootShaftHeight: String,
    footwearMeasurementsCalfCircumference: String,

    // Jewelry measurements
    jewelryMeasurementsRingSize: String,
    jewelryMeasurementsNecklaceBraceletLength: String,
    jewelryMeasurementsPendantDimensions: String,
    jewelryMeasurementsJewelryDimensions: String,

    // Furniture and large item measurements
    furnitureLargeItemMeasurementsHeight: String,
    furnitureLargeItemMeasurementsWidth: String,
    furnitureLargeItemMeasurementsDepth: String,
    furnitureLargeItemMeasurementsLength: String,
    furnitureLargeItemMeasurementsSeatHeight: String,
    furnitureLargeItemMeasurementsTabletopDimensions: String,

    // General measurements
    generalMeasurementsWeight: String,
    generalMeasurementsDiameter: String,
    generalMeasurementsVolumeCapacity: String,
    generalMeasurementsOtherSpecificMeasurements: String,

    // Condition
    conditionRating: String,
    conditionSignsOfWear: String,
    conditionDetailedNotes: String,
    conditionRepairNeeds: String,
    conditionCleaningRequirements: String,
    conditionEstimatedRepairCosts: Number,
    conditionEstimatedCleaningCosts: Number,
    conditionTimeSpentOnRepairsCleaning: String,

    // Financials
    financialsPurchasePrice: Number,
    financialsTotalRepairAndCleaningCosts: Number,
    financialsEstimatedShippingCosts: Number,
    financialsPlatformFees: Number,
    financialsExpectedProfit: Number,
    financialsProfitMargin: Number,
    financialsEstimatedMarketValue: Number,
    financialsAcquisitionCost: Number,

    // Market analysis
    marketAnalysisMarketDemand: String,
    marketAnalysisHistoricalPriceTrends: String,
    marketAnalysisMarketSaturation: String,
    marketAnalysisSalesVelocity: String,
    marketAnalysisSuggestedListingPrice: Number,
    marketAnalysisMinimumAcceptablePrice: Number,

    itemCareInstructions: String,
    keywordsForSeo: String,
    lotOrBundleInformation: String,
    customizableFields: String,
    recommendedSalePlatforms: String,

    // Compliance
    compliancePlatformPolicies: String,
    complianceAuthenticityMarkers: String,
    complianceCounterfeitRisk: String,
    complianceStatus: String,
    complianceRestrictedItemCheck: String,

    // Inventory details
    inventoryDetailsInventoryId: String,
    inventoryDetailsStorageLocation: String,
    inventoryDetailsAcquisitionDate: Date,
    inventoryDetailsTargetMarket: String,
    inventoryDetailsTrendingItems: String,
    inventoryDetailsCustomerPreferences: String,
    inventoryDetailsAcquisitionLocation: String,
    inventoryDetailsSupplierInformation: String,

    // Images (remains an array)
    images: [
      {
        id: String,
        url: String,
        filename: String,
        isNew: Boolean,
      },
    ],

    // Dates
    purchaseDate: Date,
    listingDate: Date,

    sellerNotes: String,
    contextData: Object,
    purchaseRecommendation: String,
    detailedBreakdown: String,
    sampleForSaleListing: String,
    isDraft: { type: Boolean, default: true },

    // AI-generated content
    messages: [{ role: String, content: String }],
  },
  { timestamps: true }
);

// Check if the model already exists before defining it
export const DraftItem =
  mongoose.models.DraftItem || mongoose.model('DraftItem', DraftItemSchema);
