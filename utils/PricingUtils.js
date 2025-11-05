// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
};

// Calculate delivery fee based on distance (R50 per 2km)
export const calculateDeliveryFee = (distance) => {
  const segments = Math.ceil(distance / 2); // Round up to nearest 2km segment
  return segments * 50; // R50 per 2km segment
};

// Calculate travel fee for home visits (R50 per 2km)
export const calculateTravelFee = (distance) => {
  return calculateDeliveryFee(distance); // Same calculation as delivery
};

// Get nearest clinic to patient location
export const getNearestClinic = (patientLat, patientLon) => {
  const CLINICS = [
    {
      id: 'limpopo',
      name: 'CareExpress Limpopo Clinic',
      coordinate: { latitude: -23.9062, longitude: 29.4560 },
    },
    {
      id: 'johannesburg',
      name: 'CareExpress Johannesburg Clinic',
      coordinate: { latitude: -26.1907, longitude: 28.0301 },
    },
  ];

  let nearestClinic = CLINICS[0];
  let minDistance = calculateDistance(
    patientLat, 
    patientLon, 
    CLINICS[0].coordinate.latitude, 
    CLINICS[0].coordinate.longitude
  );

  CLINICS.forEach(clinic => {
    const distance = calculateDistance(
      patientLat, 
      patientLon, 
      clinic.coordinate.latitude, 
      clinic.coordinate.longitude
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestClinic = clinic;
    }
  });

  return { clinic: nearestClinic, distance: minDistance };
};
