import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const pickerIcon = L.divIcon({
  className: 'location-picker-marker',
  html: `
    <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
      <span style="position:absolute; inset:0; border-radius:50%; background:rgba(34,211,238,0.4); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#22D3EE" stroke="#050B18" stroke-width="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function LocationPickerMap({
  initialLat = 37.7749,
  initialLng = -122.4194,
  onLocationSelected
}) {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressPreview, setAddressPreview] = useState('');

  const reverseGeocode = async (lat, lng) => {
    try {
      setIsGeocoding(true);
      // Nominatim openstreetmap reverse geocode
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      const data = res.data;
      const addr = data.address || {};
      const area = addr.neighbourhood || addr.suburb || addr.city_district || addr.quarter || addr.city || 'Metro Area';
      const street = addr.road ? `${addr.house_number || ''} ${addr.road}`.trim() : '';
      const formatted = data.display_name || `${street}, ${area}`;

      setAddressPreview(formatted);

      onLocationSelected({
        latitude: lat,
        longitude: lng,
        area,
        street,
        ward: addr.suburb || addr.city_district || 'Ward 1',
        formattedAddress: formatted
      });
    } catch (err) {
      // Fallback if nominatim has network issue or rate limit
      const fallbackArea = 'Downtown District';
      const fallbackStreet = 'Market St';
      onLocationSelected({
        latitude: lat,
        longitude: lng,
        area: fallbackArea,
        street: fallbackStreet,
        ward: 'Ward 1',
        formattedAddress: `${fallbackStreet}, ${fallbackArea}`
      });
      setAddressPreview(`${fallbackStreet}, ${fallbackArea}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleLocationChange = (lat, lng) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        handleLocationChange(latitude, longitude);
        toast.success('Location detected!');
      },
      (err) => {
        setIsLocating(false);
        toast.error('Could not retrieve current location. Please click on the map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    // Initial geocode
    reverseGeocode(initialLat, initialLng);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-primary-aqua" />
          Click on map to adjust exact leak pin
        </span>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-aqua/15 text-primary-aqua border border-primary-aqua/30 hover:bg-primary-aqua/25 transition-colors disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Crosshair className="w-3.5 h-3.5" />
          )}
          <span>Use Current Location</span>
        </button>
      </div>

      <div className="relative rounded-2xl overflow-hidden glass-panel border border-white/10 h-72 shadow-xl">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={pickerIcon} />
          <MapClickHandler onLocationChange={handleLocationChange} />
        </MapContainer>
      </div>

      {/* Address preview pill */}
      <div className="p-3 rounded-xl bg-background-elevated/70 border border-white/10 flex items-center gap-2 text-xs">
        {isGeocoding ? (
          <div className="flex items-center gap-2 text-primary-aqua">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Resolving street address...</span>
          </div>
        ) : (
          <div className="text-slate-300 truncate">
            <span className="font-bold text-white">Detected: </span>
            {addressPreview || 'Coordinates selected'}
          </div>
        )}
      </div>
    </div>
  );
}

