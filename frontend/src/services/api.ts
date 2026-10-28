import axios from 'axios';
import {
  User, Commodity, Market, MarketPrice, HistoricalTrendPoint, PriceComparisonResponse,
  Lot, Listing, Offer, Transaction, Payment, Recommendation, KYCVerification,
  StorageFacility, LogisticsBooking, NotificationItem, AdminStats, BuyerRequirement, FPOMember,
  WeatherData
} from '../types';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Token Expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
          return apiClient(error.config);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (data: any) => apiClient.post('/auth/login', data),
  register: (data: any) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get<User>('/auth/me'),

  // Commodities & Markets
  getCommodities: (category?: string) => apiClient.get<Commodity[]>('/commodities', { params: { category } }),
  getMarkets: (state?: string, district?: string) => apiClient.get<Market[]>('/markets', { params: { state, district } }),

  // Market Prices & Discovery
  getMarketPrices: (params?: { commodity_id?: number; market_id?: number; state?: string; page?: number; page_size?: number }) =>
    apiClient.get<MarketPrice[]>('/market-prices', { params }),
  getHistoricalTrends: (commodityId: number, marketId?: number, days: number = 30) =>
    apiClient.get<HistoricalTrendPoint[]>('/market-prices/historical', { params: { commodity_id: commodityId, market_id: marketId, days } }),
  comparePrices: (commodityId: number) =>
    apiClient.get<PriceComparisonResponse>('/market-prices/compare', { params: { commodity_id: commodityId } }),
  importPricesCSV: (formData: FormData) =>
    apiClient.post('/market-prices/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Lots & Inspections
  getMyLots: () => apiClient.get<Lot[]>('/lots'),
  createLot: (data: any) => apiClient.post<Lot>('/lots', data),
  addInspection: (lotId: number, data: any) => apiClient.post(`/lots/${lotId}/inspections`, data),

  // Listings
  getListings: (params?: any) => apiClient.get<Listing[]>('/listings', { params }),
  getMyListings: () => apiClient.get<Listing[]>('/listings/my-listings'),
  getListing: (id: number) => apiClient.get<Listing>(`/listings/${id}`),
  createListing: (data: any) => apiClient.post<Listing>('/listings', data),

  // Buyer Requirements
  getBuyerRequirements: (commodityId?: number) =>
    apiClient.get<BuyerRequirement[]>('/listings/buyer-requirements/all', { params: { commodity_id: commodityId } }),
  createBuyerRequirement: (data: any) => apiClient.post<BuyerRequirement>('/listings/buyer-requirements', data),

  // Offers
  getSentOffers: () => apiClient.get<Offer[]>('/offers/sent'),
  getReceivedOffers: () => apiClient.get<Offer[]>('/offers/received'),
  createOffer: (data: any) => apiClient.post<Offer>('/offers', data),
  respondToOffer: (offerId: number, data: { status: string; counter_price_per_unit?: number; seller_notes?: string }) =>
    apiClient.put<Offer>(`/offers/${offerId}/respond`, data),

  // Transactions & Escrow
  getTransactions: () => apiClient.get<Transaction[]>('/transactions'),
  getTransaction: (id: number) => apiClient.get<Transaction>(`/transactions/${id}`),
  updateFulfillmentStatus: (id: number, fulfillment_status: string) =>
    apiClient.put<Transaction>(`/transactions/${id}/status`, { fulfillment_status }),
  initiatePayment: (transactionId: number) =>
    apiClient.post<Payment>('/transactions/payments/initiate', { transaction_id: transactionId, payment_method: 'RAZORPAY_TEST' }),
  verifyPayment: (data: { payment_id: number; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    apiClient.post<Payment>('/transactions/payments/verify', data),
  raiseDispute: (data: { transaction_id: number; dispute_reason: string; description: string }) =>
    apiClient.post('/transactions/disputes', data),
  resolveDispute: (disputeId: number, data: { resolution_status: string; resolution_notes: string }) =>
    apiClient.put(`/transactions/disputes/${disputeId}/resolve`, data),
  addReview: (data: { transaction_id: number; rating: number; comment?: string }) =>
    apiClient.post('/transactions/reviews', data),

  // Price Recommendation Engine
  getRecommendation: (data: { commodity_id: number; quantity: number; farmer_district?: string; farmer_state?: string; storage_available?: boolean }) =>
    apiClient.post<Recommendation>('/recommendations', data),
  getRecommendationHistory: () => apiClient.get<Recommendation[]>('/recommendations/history'),

  // FPO Operations
  getFPOMembers: () => apiClient.get<FPOMember[]>('/fpos/members'),
  addFPOMember: (data: any) => apiClient.post<FPOMember>('/fpos/members', data),
  aggregateLots: (data: any) => apiClient.post('/fpos/aggregate-lots', data),

  // Storage & Logistics
  getStorageFacilities: (state?: string, facilityType?: string) =>
    apiClient.get<StorageFacility[]>('/storage/facilities', { params: { state, facility_type: facilityType } }),
  bookStorage: (facilityId: number, data: any) => apiClient.post(`/storage/facilities/${facilityId}/book`, data),
  getLogisticsBookings: () => apiClient.get<LogisticsBooking[]>('/logistics/bookings'),
  bookLogistics: (data: any) => apiClient.post<LogisticsBooking>('/logistics/book', data),

  // KYC
  submitKYC: (data: { document_type: string; document_number: string; document_url?: string }) =>
    apiClient.post<KYCVerification>('/kyc/submit', data),
  getMyKYC: () => apiClient.get<KYCVerification[]>('/kyc/my-status'),
  getPendingKYC: () => apiClient.get<KYCVerification[]>('/kyc/pending'),
  reviewKYC: (kycId: number, data: { status: string; remarks?: string }) =>
    apiClient.put<KYCVerification>(`/kyc/${kycId}/review`, data),

  // Notifications
  getNotifications: () => apiClient.get<NotificationItem[]>('/notifications'),
  markNotificationAsRead: (id: number) => apiClient.put(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => apiClient.put('/notifications/read-all'),

  // Admin Operations
  getAdminStats: () => apiClient.get<AdminStats>('/admin/dashboard-stats'),
  getAllUsers: (role?: string) => apiClient.get<any[]>('/admin/users', { params: { role } }),
  toggleUserActive: (userId: number) => apiClient.put(`/admin/users/${userId}/toggle-active`),
  moderateListing: (listingId: number, status: string) => apiClient.put(`/admin/listings/${listingId}/moderate`, { status }),

  // Weather (Open-Meteo)
  getWeather: (district?: string, state?: string) =>
    apiClient.get<WeatherData>('/weather', { params: { district, state } }),
};

export const commoditiesApi = {
  getAll: (category?: string) => api.getCommodities(category),
};

export const marketsApi = {
  getAll: (state?: string, district?: string) => api.getMarkets(state, district),
};

export const listingsApi = {
  getAll: (params?: any) => api.getListings(params),
  getMy: () => api.getMyListings(),
  getById: (id: any) => api.getListing(id),
  create: (data: any) => api.createListing(data),
};

export const offersApi = {
  getSent: () => api.getSentOffers(),
  getReceived: () => api.getReceivedOffers(),
  create: (data: any) => api.createOffer(data),
  respond: (id: any, data: any) => api.respondToOffer(id, data),
};

export const transactionsApi = {
  getAll: () => api.getTransactions(),
  getById: (id: any) => api.getTransaction(id),
  updateStatus: (id: any, status: string) => api.updateFulfillmentStatus(id, status),
  initiatePayment: (txId: any) => api.initiatePayment(txId),
  verifyPayment: (txId: any, data: any) => api.verifyPayment({ payment_id: txId, ...data }),
  raiseDispute: (txId: any, data: any) => api.raiseDispute({ transaction_id: txId, ...data }),
};

export const reviewsApi = {
  create: (data: any) => api.addReview(data),
};

export const fposApi = {
  getMyFPO: () => apiClient.get<any>('/fpos/my-fpo'),
  getMembers: () => api.getFPOMembers(),
  addMember: (fpoId: any, data: any) => api.addFPOMember(data),
  aggregateProduce: (fpoId: any, data: any) => api.aggregateLots(data),
};

export const storageLogisticsApi = {
  getStorageFacilities: (state?: string, type?: string) => api.getStorageFacilities(state, type),
  bookStorage: (facilityId: any, data: any) => api.bookStorage(facilityId, data),
  getLogisticsBookings: () => api.getLogisticsBookings(),
  createLogisticsBooking: (data: any) => api.bookLogistics(data),
};

export const kycApi = {
  getMyStatus: () => apiClient.get<any>('/kyc/my-status'),
  getPending: () => api.getPendingKYC(),
  submit: (data: any) => api.submitKYC(data),
  review: (id: any, data: any) => api.reviewKYC(id, data),
};

export const adminApi = {
  getStats: () => api.getAdminStats(),
  getUsers: (role?: string) => api.getAllUsers(role),
  toggleActive: (id: any) => api.toggleUserActive(id),
  moderate: (id: any, status: string) => api.moderateListing(id, status),
};

export const weatherApi = {
  getWeather: (district?: string, state?: string) => api.getWeather(district, state),
};

export default api;
