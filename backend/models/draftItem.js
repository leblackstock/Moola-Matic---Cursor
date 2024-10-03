import mongoose from 'mongoose';

const draftItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: String,
  description: String,
  purchasePrice: Number,
  estimatedValue: Number,
  category: String,
  condition: String,
  images: [String],
  purchaseDate: Date,
  listingDate: Date,
  sellerNotes: String,
  contextData: Object,
  isDraft: { type: Boolean, default: true }
}, { timestamps: true });

export const DraftItem = mongoose.model('DraftItem', draftItemSchema);