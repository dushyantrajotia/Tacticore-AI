import { useState } from 'react';
import SvgIcon from '../SvgIcon';

export default function ResourcePanel({ resources: assignedResources, currentMarkers = [] }) {
  const maxVolunteers = assignedResources?.volunteers || 0;
  const maxTrucks = assignedResources?.fireTrucks || 0;
  const maxPumps = assignedResources?.waterPumps || 0;
  const maxAmbulance = assignedResources?.ambulance || 0;
  const maxPolice = assignedResources?.police || 0;
  const maxCitizen = assignedResources?.citizen || 0;
  const maxCar = assignedResources?.car || 0;
  const maxBike = assignedResources?.bike || 0;

  const baseResources = [
    { type: 'add_person', name: 'Volunteers', max: maxVolunteers, icon: '👥' },
    { type: 'add_truck', name: 'Fire Trucks', max: maxTrucks, icon: '🚒' },
    { type: 'add_pump', name: 'Water Pumps', max: maxPumps, icon: '💧' },
    { type: 'add_ambulance', name: 'Ambulances', max: maxAmbulance, icon: '🚑' },
    { type: 'add_police', name: 'Police', max: maxPolice, icon: '🚓' },
    { type: 'add_citizen', name: 'Citizens', max: maxCitizen, icon: '🚶' },
    { type: 'add_car', name: 'Cars', max: maxCar, icon: '🚗' },
    { type: 'add_bike', name: 'Bikes', max: maxBike, icon: '🚲' },
  ];

  const resources = baseResources
    .filter(r => r.max > 0)
    .map(r => ({
      name: r.name,
      current: Math.max(0, r.max - currentMarkers.filter(m => m.type === r.type).length),
      max: r.max,
      icon: r.icon
    }));

  const customItems = (assignedResources?.customItems || []).map(item => {
    const used = currentMarkers.filter(m => m.type === `add_custom_${item.name}`).length;
    return { name: item.name, current: Math.max(0, item.quantity - used), max: item.quantity, icon: '📦' };
  });

  const allResources = [...resources, ...customItems];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Available Resources</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {allResources.map((resource, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--gray-300)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SvgIcon name={resource.icon} size="1.125rem" />
                {resource.name}
              </label>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: resource.current === 0 ? 'var(--danger)' : 'var(--primary)' }}>
                {resource.current}/{resource.max}
              </span>
            </div>
            <div style={{ width: '100%', background: 'var(--gray-700)', borderRadius: '9999px', height: '0.5rem' }}>
              <div 
                style={{ 
                  height: '0.5rem', 
                  borderRadius: '9999px', 
                  transition: 'all 0.3s ease',
                  width: `${resource.max > 0 ? (resource.current / resource.max) * 100 : 0}%`,
                  background: resource.current === 0 ? 'var(--danger)' : 'var(--success)'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-700)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>
          * Allocate resources via the Planning Map to coordinate the response.
        </p>
      </div>
    </div>
  );
}
