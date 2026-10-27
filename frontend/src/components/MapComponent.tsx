import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { FoodDonation } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Utensils } from 'lucide-react';

interface MapComponentProps {
  donations: FoodDonation[];
  center?: [number, number];
  zoom?: number;
  selectedDonationId?: number;
}

// Custom Leaflet DivIcon for green map pins
const createCustomIcon = (isSelected = false) => {
  return L.divIcon({
    className: 'custom-pin-container',
    html: `
      <div style="
        background-color: ${isSelected ? '#15803d' : '#22c55e'};
        color: white;
        width: ${isSelected ? '36px' : '30px'};
        height: ${isSelected ? '36px' : '30px'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        border: 2px solid white;
        transition: transform 0.2s;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 0 0-7.07 17.07l.07.07L12 22l7-2.86.07-.07A10 10 0 0 0 12 2z"/>
        </svg>
      </div>
    `,
    iconSize: isSelected ? [36, 36] : [30, 30],
    iconAnchor: isSelected ? [18, 36] : [15, 30],
    popupAnchor: [0, -32],
  });
};

function ChangeMapView({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  donations,
  center = [37.7749, -122.4194],
  zoom = 12,
  selectedDonationId,
}) => {
  // Filter donations with valid latitude and longitude
  const validDonations = donations.filter(
    (d) => typeof d.latitude === 'number' && typeof d.longitude === 'number'
  );

  const initialCenter = validDonations.length > 0 && validDonations[0].latitude && validDonations[0].longitude
    ? [validDonations[0].latitude, validDonations[0].longitude] as [number, number]
    : center;

  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-gray-100 shadow-xs relative">
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeMapView coords={initialCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validDonations.map((d) => (
          <Marker
            key={d.id}
            position={[d.latitude!, d.longitude!]}
            icon={createCustomIcon(selectedDonationId === d.id)}
          >
            <Popup className="custom-popup">
              <div className="p-1 max-w-xs text-xs font-sans">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-forest-100 text-forest-800 uppercase mb-1">
                  {d.category.name}
                </span>
                <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                  {d.title}
                </h4>
                <p className="text-gray-500 text-[11px] mt-1 font-medium">
                  {d.donor.organization_name || d.donor.email}
                </p>
                <div className="flex items-center justify-between text-gray-600 mt-2 pt-2 border-t border-gray-100 font-semibold">
                  <span>{d.quantity} {d.quantity_unit} (~{d.estimated_meals} meals)</span>
                  <Link
                    to={`/donations/${d.id}`}
                    className="text-forest-700 hover:text-forest-900 hover:underline"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

