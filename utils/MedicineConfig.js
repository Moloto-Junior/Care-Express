export const medicineImages = {
  paracetamol:
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  ibuprofen:
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
  amoxicillin:
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  vitamin:
    'https://images.unsplash.com/photo-1526424382096-74a93e105682?w=200&h=200&fit=crop',
  aspirin:
    'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
  tablet:
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  capsule:
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  powder:
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  liquid:
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  injection:
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  default:
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
};

/**
 * Get medicine image based on medicine name
 * @param {string} name - Medicine name
 * @returns {string} Image URL
 */
export const getMedicineImage = (name) => {
  if (!name) return medicineImages.default;

  const lower = name.toLowerCase();

  // Check if name matches any medicine type
  for (const key in medicineImages) {
    if (lower.includes(key)) {
      return medicineImages[key];
    }
  }

  // Default fallback
  return medicineImages.default;
};

/**
 * Generate random medicine price
 * @returns {number} Price between 25 and 500
 */
export const generateMedicinePrice = () => {
  return Math.floor(Math.random() * (500 - 25 + 1)) + 25;
};

/**
 * Common medicines list for autocomplete
 */
export const commonMedicines = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Aspirin',
  'Vitamin C',
  'Vitamin D',
  'Antibiotic Cream',
  'Cough Syrup',
  'Allergy Tablets',
  'Blood Pressure Medication',
  'Diabetes Medication',
  'Antacid',
  'Multivitamin',
  'Omega 3',
  'Sleeping Tablets',
];

/**
 * Validate medicine data
 * @param {object} medicine - Medicine object
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateMedicine = (medicine) => {
  if (!medicine.name || medicine.name.trim() === '') {
    return { valid: false, error: 'Medicine name is required' };
  }

  if (!medicine.manufacturer || medicine.manufacturer.trim() === '') {
    return { valid: false, error: 'Manufacturer is required' };
  }

  if (!medicine.price || medicine.price < 0) {
    return { valid: false, error: 'Price must be greater than 0' };
  }

  if (!medicine.quantity || medicine.quantity < 0) {
    return { valid: false, error: 'Quantity must be 0 or greater' };
  }

  return { valid: true };
};
