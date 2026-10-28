import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storageLogisticsApi } from '../services/api';
import { StorageFacility, LogisticsBooking } from '../types';
import StatusBadge from '../components/StatusBadge';
import { 
  Warehouse, Truck, MapPin, Calendar, CheckCircle2, 
  ThermometerSnowflake, RefreshCw, Plus, ShieldCheck, DollarSign
} from 'lucide-react';

const StorageLogisticsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'storage' | 'logistics'>('storage');
  const [facilities, setFacilities] = useState<StorageFacility[]>([]);
  const [bookings, setBookings] = useState<LogisticsBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Storage Reservation Modal State
  const [selectedFacility, setSelectedFacility] = useState<StorageFacility | null>(null);
  const [storageQty, setStorageQty] = useState('');
  const [storageStart, setStorageStart] = useState('');
  const [storageEnd, setStorageEnd] = useState('');

  // Logistics Booking Modal State
  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [freightQty, setFreightQty] = useState('');
  const [vehicleType, setVehicleType] = useState('Standard 16T Truck');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, bookRes] = await Promise.all([
        storageLogisticsApi.getStorageFacilities(),
        storageLogisticsApi.getLogisticsBookings(),
      ]);
      setFacilities(facRes.data);
      setBookings(bookRes.data);
    } catch (err: any) {
      console.error('Failed to load storage/logistics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBookStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await storageLogisticsApi.bookStorage(selectedFacility.id, {
        quantity: Number(storageQty),
        start_date: storageStart,
        end_date: storageEnd,
      });
      setFeedback({ type: 'success', message: 'Storage reservation requested successfully!' });
      setSelectedFacility(null);
      setStorageQty('');
      setStorageStart('');
      setStorageEnd('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Storage booking failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await storageLogisticsApi.createLogisticsBooking({
        pickup_location: pickupLocation,
        dropoff_location: dropoffLocation,
        quantity: Number(freightQty),
        vehicle_type: vehicleType,
      });
      setFeedback({ type: 'success', message: 'Freight logistics trip booked successfully!' });
      setShowLogisticsModal(false);
      setPickupLocation('');
      setDropoffLocation('');
      setFreightQty('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Logistics booking failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/80 text-teal-200 text-xs font-semibold mb-3 border border-teal-600/30">
              <Warehouse className="w-3.5 h-3.5" /> Post-Harvest Infrastructure
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Storage & Freight Logistics</h1>
            <p className="text-teal-100/90 text-sm mt-1 max-w-xl">
              Certified cold storages, WDRA-accredited dry grain warehouses, and integrated fleet dispatch for farm produce.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowLogisticsModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-all text-sm shadow-md"
            >
              <Truck className="w-4 h-4" /> Book Freight Transport
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-900/80 border border-emerald-400 text-emerald-100' : 'bg-rose-900/80 border border-rose-400 text-rose-100'}`}>
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-8">
        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'storage'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Warehouse className="w-4 h-4" /> Certified Storage Facilities ({facilities.length})
        </button>
        <button
          onClick={() => setActiveTab('logistics')}
          className={`pb-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'logistics'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" /> Logistics Bookings & Dispatches ({bookings.length})
        </button>
      </div>

      {/* Tab 1: Storage Facilities */}
      {activeTab === 'storage' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((fac) => (
            <div key={fac.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">{fac.name}</h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 uppercase tracking-wider shrink-0">
                    {fac.facility_type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{fac.address}, {fac.district}, {fac.state}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Capacity:</span>
                    <span className="font-semibold text-slate-800">{(fac.capacity_quintals || fac.capacity_metric_tonnes || 0).toLocaleString('en-IN')} Qtl</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Available Space:</span>
                    <span className="font-semibold text-emerald-700">{(fac.available_quintals || fac.available_capacity_tonnes || 0).toLocaleString('en-IN')} Qtl</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daily Charge:</span>
                    <span className="font-bold text-slate-900">₹{fac.rate_per_day_per_quintal} / Qtl / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cold Chain Control:</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      {fac.cold_storage ? (
                        <>
                          <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-600" />
                          {fac.temperature_celsius}°C ({fac.humidity_percentage}% RH)
                        </>
                      ) : (
                        'Ambient Ventilated'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedFacility(fac)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition-colors"
              >
                Reserve Space
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Logistics Bookings */}
      {activeTab === 'logistics' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Freight Transport Dispatches</h2>
              <p className="text-xs text-slate-500">Live GPS tracking and dispatch state of agricultural road shipments</p>
            </div>
            <button
              onClick={() => setShowLogisticsModal(true)}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
            >
              + New Dispatch
            </button>
          </div>

          <div className="overflow-x-auto">
            {bookings.length > 0 ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Booking Ref</th>
                    <th className="py-3 px-6">Route</th>
                    <th className="py-3 px-6">Vehicle & Payload</th>
                    <th className="py-3 px-6">Distance / Est. Cost</th>
                    <th className="py-3 px-6">Pickup Date</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-800">{b.booking_number}</td>
                      <td className="py-4 px-6 text-slate-900 font-semibold">
                        <div>{b.pickup_location}</div>
                        <div className="text-xs text-slate-400 font-normal">→ {b.dropoff_location}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-700">
                        {b.vehicle_type} • <span className="font-semibold">{b.quantity} Qtl</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        ₹{(b.estimated_cost || 0).toLocaleString('en-IN')}
                        <span className="block text-xs font-normal text-slate-400">{b.distance_km || 0} km</span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {b.pickup_date ? new Date(b.pickup_date).toLocaleDateString('en-IN') : 'Immediate Dispatch'}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3 stroke-1" />
                <p className="text-base font-semibold text-slate-700">No dispatches booked yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Book farm-gate logistics to transport harvested lots directly to APMC mandis or buyer distribution centers.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storage Reservation Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Reserve Warehouse Space</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedFacility.name}</p>
            
            <form onSubmit={handleBookStorage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity (Quintals) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 50"
                  value={storageQty}
                  onChange={(e) => setStorageQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={storageStart}
                    onChange={(e) => setStorageStart(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={storageEnd}
                    onChange={(e) => setStorageEnd(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFacility(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Confirming...' : 'Book Storage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logistics Booking Modal */}
      {showLogisticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Book Freight Transport</h3>
            <p className="text-xs text-slate-500 mb-4">Farm-to-Mandi or Farm-to-Buyer delivery truck dispatch.</p>

            <form onSubmit={handleBookLogistics} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Pickup Farm / Origin *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patil Farm, Taluka Niphad, Nashik"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Destination Mandi / Warehouse *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vashi APMC Yard, Navi Mumbai"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payload (Quintals) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 80"
                    value={freightQty}
                    onChange={(e) => setFreightQty(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vehicle Type *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Mini Truck (Tata Ace - 1.5T)">Mini Truck (Tata Ace - 1.5T)</option>
                    <option value="Medium Commercial (Eicher - 7T)">Medium Commercial (Eicher - 7T)</option>
                    <option value="Standard Heavy (16T Truck)">Standard Heavy (16T Truck)</option>
                    <option value="Refrigerated Reefer Container">Refrigerated Reefer Container</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogisticsModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Confirm Freight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageLogisticsPage;
