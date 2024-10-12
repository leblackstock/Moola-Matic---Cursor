import mongoose from 'mongoose';

const draftItemSchema = new mongoose.Schema(
  {
    // Basic item information
    itemId: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    description: String,
    category: String,

    // Item details
    itemDetails: {
      type: { type: String, required: false },
      brand: String,
      condition: String,
      rarity: String,
      authenticityConfirmed: { type: Boolean, default: null },
      packagingAccessories: String,
    },

    // Images
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

    // Financial information
    financials: {
      purchasePrice: Number,
      cleaningRepairCosts: Number,
      estimatedShippingCosts: Number,
      platformFees: Number,
      expectedProfit: Number,
      estimatedValue: Number,
    },

    // Market analysis
    marketAnalysis: {
      marketDemand: String,
      historicalPriceTrends: String,
      marketSaturation: String,
      salesVelocity: String,
    },

    // Recommendation
    finalRecommendation: {
      purchaseRecommendation: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      detailedBreakdown: String,
    },

    // Additional information
    sellerNotes: String,
    contextData: Object,

    // Draft status
    isDraft: { type: Boolean, default: true },

    // AI-generated content
    messages: [{ role: String, content: String }],
  },
  { timestamps: true }
);

// Check if the model already exists before defining it
export const DraftItem =
  mongoose.models.DraftItem || mongoose.model('DraftItem', draftItemSchema);
