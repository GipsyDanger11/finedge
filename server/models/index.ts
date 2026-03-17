import mongoose, { Schema, Document } from "mongoose";

// User Schema
export interface IUser extends Document {
  openId: string;
  name?: string;
  email?: string;
  loginMethod?: string;
  role: 'user' | 'admin';
  bio?: string;
  avatarUrl?: string;
  lastSignedIn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  openId: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  email: { type: String },
  loginMethod: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  bio: { type: String },
  avatarUrl: { type: String },
  lastSignedIn: { type: Date, default: Date.now, required: true },
}, { timestamps: true });

export const User: mongoose.Model<IUser> = mongoose.models.User
  ? (mongoose.models.User as mongoose.Model<IUser>)
  : mongoose.model<IUser>("User", userSchema);

// User Profile Schema
export interface IUserProfile extends Document {
  userId: mongoose.Types.ObjectId | string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  portfolioVisibility: 'private' | 'public' | 'friends';
  createdAt: Date;
  updatedAt: Date;
}

const userProfileSchema = new Schema<IUserProfile>({
  userId: { type: Schema.Types.Mixed, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  bio: { type: String },
  avatarUrl: { type: String },
  portfolioVisibility: { type: String, enum: ['private', 'public', 'friends'], default: 'private', required: true },
}, { timestamps: true });

export const UserProfile: mongoose.Model<IUserProfile> = mongoose.models.UserProfile
  ? (mongoose.models.UserProfile as mongoose.Model<IUserProfile>)
  : mongoose.model<IUserProfile>("UserProfile", userProfileSchema);

// Follows Schema
export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId | string;
  followingId: mongoose.Types.ObjectId | string;
  createdAt: Date;
}

const followSchema = new Schema<IFollow>({
  followerId: { type: Schema.Types.Mixed, required: true, index: true },
  followingId: { type: Schema.Types.Mixed, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Follow: mongoose.Model<IFollow> = mongoose.models.Follow
  ? (mongoose.models.Follow as mongoose.Model<IFollow>)
  : mongoose.model<IFollow>("Follow", followSchema);

// Portfolio Schema
export interface IPortfolio extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  description?: string;
  type: 'live' | 'practice';
  initialBalance: number;
  currentBalance: number;
  totalInvested: number;
  totalGain: number;
  gainPercentage: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const portfolioSchema = new Schema<IPortfolio>({
  userId: { type: Schema.Types.Mixed, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['live', 'practice'], default: 'live', required: true },
  initialBalance: { type: Number, required: true },
  currentBalance: { type: Number, required: true },
  totalInvested: { type: Number, default: 0 },
  totalGain: { type: Number, default: 0 },
  gainPercentage: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
}, { timestamps: true });

export const Portfolio: mongoose.Model<IPortfolio> = mongoose.models.Portfolio
  ? (mongoose.models.Portfolio as mongoose.Model<IPortfolio>)
  : mongoose.model<IPortfolio>("Portfolio", portfolioSchema);

// Asset Schema
export interface IAsset extends Document {
  portfolioId: mongoose.Types.ObjectId;
  symbol: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'commodity' | 'bond';
  quantity: number;
  averageCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  lastUpdated: Date;
  createdAt: Date;
}

const assetSchema = new Schema<IAsset>({
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  symbol: { type: String, required: true, index: true },
  assetType: { type: String, enum: ['stock', 'crypto', 'etf', 'commodity', 'bond'], required: true },
  quantity: { type: Number, required: true },
  averageCost: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  gainLoss: { type: Number, default: 0 },
  gainLossPercentage: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Pre-save to update lastUpdated
assetSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});
export const Asset: mongoose.Model<IAsset> = mongoose.models.Asset
  ? (mongoose.models.Asset as mongoose.Model<IAsset>)
  : mongoose.model<IAsset>("Asset", assetSchema);

// Transaction Schema
export interface ITransaction extends Document {
  portfolioId: mongoose.Types.ObjectId;
  assetId?: mongoose.Types.ObjectId;
  symbol: string;
  type: 'buy' | 'sell' | 'transfer';
  quantity: number;
  price: number;
  totalAmount: number;
  fee: number;
  notes?: string;
  transactionDate: Date;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
  symbol: { type: String, required: true, index: true },
  type: { type: String, enum: ['buy', 'sell', 'transfer'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  notes: { type: String },
  transactionDate: { type: Date, required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Transaction: mongoose.Model<ITransaction> = mongoose.models.Transaction
  ? (mongoose.models.Transaction as mongoose.Model<ITransaction>)
  : mongoose.model<ITransaction>("Transaction", transactionSchema);

// Price Alert Schema
export interface IPriceAlert extends Document {
  userId: mongoose.Types.ObjectId | string;
  symbol: string;
  alertType: 'above' | 'below';
  targetPrice: number;
  isActive: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

const priceAlertSchema = new Schema<IPriceAlert>({
  userId: { type: Schema.Types.Mixed, required: true, index: true },
  symbol: { type: String, required: true, index: true },
  alertType: { type: String, enum: ['above', 'below'], required: true },
  targetPrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const PriceAlert: mongoose.Model<IPriceAlert> = mongoose.models.PriceAlert
  ? (mongoose.models.PriceAlert as mongoose.Model<IPriceAlert>)
  : mongoose.model<IPriceAlert>("PriceAlert", priceAlertSchema);

// Notification Schema
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId | string;
  type: 'price_alert' | 'milestone' | 'portfolio_update' | 'social' | 'system';
  title: string;
  message: string;
  relatedData?: any;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.Mixed, required: true, index: true },
  type: { type: String, enum: ['price_alert', 'milestone', 'portfolio_update', 'social', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedData: { type: Schema.Types.Mixed },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Notification: mongoose.Model<INotification> = mongoose.models.Notification
  ? (mongoose.models.Notification as mongoose.Model<INotification>)
  : mongoose.model<INotification>("Notification", notificationSchema);

// Market Data Schema
export interface IMarketData extends Document {
  symbol: string;
  currentPrice: number;
  dayHigh?: number;
  dayLow?: number;
  dayChange?: number;
  dayChangePercent?: number;
  marketCap?: number;
  volume?: number;
  lastUpdated: Date;
}

const marketDataSchema = new Schema<IMarketData>({
  symbol: { type: String, required: true, unique: true, index: true },
  currentPrice: { type: Number, required: true },
  dayHigh: { type: Number },
  dayLow: { type: Number },
  dayChange: { type: Number },
  dayChangePercent: { type: Number },
  marketCap: { type: Number },
  volume: { type: Number },
  lastUpdated: { type: Date, default: Date.now, required: true },
}, { timestamps: false });

export const MarketData: mongoose.Model<IMarketData> = mongoose.models.MarketData
  ? (mongoose.models.MarketData as mongoose.Model<IMarketData>)
  : mongoose.model<IMarketData>("MarketData", marketDataSchema);

// AI Insights Cache Schema
export interface IAIInsight extends Document {
  portfolioId: mongoose.Types.ObjectId;
  insightType: 'risk_analysis' | 'recommendations' | 'market_summary' | 'diversification';
  content: any;
  riskLevel?: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
}

const aiInsightSchema = new Schema<IAIInsight>({
  portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true, index: true },
  insightType: { type: String, enum: ['risk_analysis', 'recommendations', 'market_summary', 'diversification'], required: true },
  content: { type: Schema.Types.Mixed, required: true },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
  expiresAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AIInsight: mongoose.Model<IAIInsight> = mongoose.models.AIInsight
  ? (mongoose.models.AIInsight as mongoose.Model<IAIInsight>)
  : mongoose.model<IAIInsight>("AIInsight", aiInsightSchema);
