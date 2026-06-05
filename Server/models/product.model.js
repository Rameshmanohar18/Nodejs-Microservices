import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  brand: {
    type: String,
    trim: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
  },
  finalPrice: {
    type: Number,
    default: function() {
      return this.price - (this.price * this.discount / 100);
    },
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  images: [{
    url: String,
    publicId: String,
    isMain: { type: Boolean, default: false },
  }],
  videos: [{
    url: String,
    publicId: String,
  }],
  specifications: {
    type: Map,
    of: String,
  },
  attributes: {
    color: [String],
    size: [String],
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  warranty: {
    type: String,
  },
  returnPolicy: {
    type: String,
    default: '7 days return policy',
  },
  metaTitle: String,
  metaDescription: String,
  views: {
    type: Number,
    default: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Create slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  this.finalPrice = this.price - (this.price * this.discount / 100);
  next();
});

// Index for search
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text',
  tags: 'text' 
});

// Update rating when review changes
productSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { product: this._id, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (result.length > 0) {
    this.rating = result[0].avgRating;
    this.numReviews = result[0].count;
  } else {
    this.rating = 0;
    this.numReviews = 0;
  }
  await this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;