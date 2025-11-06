import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { calculateDistance, calculateDeliveryFee, calculateTravelFee, getNearestClinic } from '../utils/PricingUtils';

export default function PricingCalculator({ 
  patientLocation, 
  consultationType, 
  doctorFees, 
  showBreakdown = true 
}) {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    if (patientLocation && doctorFees) {
      calculatePricing();
    }
  }, [patientLocation, consultationType, doctorFees]);

  const calculatePricing = () => {
    const { clinic, distance } = getNearestClinic(
      patientLocation.latitude, 
      patientLocation.longitude
    );

    let consultationFee = doctorFees.consultationFee || 0;
    let travelFee = 0;
    let deliveryFee = calculateDeliveryFee(distance);

    if (consultationType === 'home' && doctorFees.availableForHomeVisits) {
      consultationFee = doctorFees.homeVisitFee || 0;
      travelFee = calculateTravelFee(distance);
    }

    const subtotal = consultationFee + travelFee;
    const total = subtotal + deliveryFee;

    setPricing({
      consultationFee,
      travelFee,
      deliveryFee,
      subtotal,
      total,
      distance: Math.round(distance * 10) / 10, 
      nearestClinic: clinic.name
    });
  };

  if (!pricing) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Calculating pricing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calculator" size={20} color={COLORS.primary} />
        <Text style={styles.title}>Price Breakdown</Text>
      </View>

      {showBreakdown && (
        <View style={styles.breakdown}>
          <View style={styles.distanceInfo}>
            <Ionicons name="location" size={16} color={COLORS.lightGray} />
            <Text style={styles.distanceText}>
              Distance to {pricing.nearestClinic}: {pricing.distance}km
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {consultationType === 'home' ? 'Home Visit Fee' : 'Consultation Fee'}
            </Text>
            <Text style={styles.priceValue}>R{pricing.consultationFee}</Text>
          </View>

          {pricing.travelFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Travel Fee</Text>
              <Text style={styles.priceValue}>R{pricing.travelFee}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Medication Delivery</Text>
            <Text style={styles.priceValue}>R{pricing.deliveryFee}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>R{pricing.subtotal}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total (with delivery)</Text>
            <Text style={styles.totalValue}>R{pricing.total}</Text>
          </View>
        </View>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {consultationType === 'home' ? 'Home visit' : 'Clinic consultation'} total: 
          <Text style={styles.summaryPrice}> R{pricing.total}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: 15,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.lightGray,
    fontStyle: 'italic',
  },
  breakdown: {
    marginBottom: 10,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '30',
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray + '50',
    marginVertical: 8,
  },
  subtotalLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  summary: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: SIZES.radius - 5,
    padding: 10,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
  },
  summaryPrice: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
