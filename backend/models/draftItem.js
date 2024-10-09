import mongoose from 'mongoose';

const draftItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, unique: true, required: true },
    name: String,
    description: String,
    purchasePrice: Number,
    estimatedValue: Number,
    category: String,
    condition: String,
    images: [
      {
        id: String,
        url: String,
        filename: String,
        isNew: Boolean,
      },
    ],
    purchaseDate: Date,
    listingDate: Date,
    sellerNotes: String,
    contextData: Object,
    isDraft: { type: Boolean, default: true },
    messages: [{ role: String, content: String }],
  },
  { timestamps: true }
);

export const DraftItem = mongoose.model('DraftItem', draftItemSchema);
