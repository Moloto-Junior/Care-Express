import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { auth, db } from '../firebaseConfig';
import { ref, push } from 'firebase/database';
import { notifyUserByUID } from './NotificationsService';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentScreen({ route, navigation }) {
  const { totalAmount = 0, cart = [] } = route.params || {};
  
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19);
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\//g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.length !== 16) return false;
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiry = (expiry) => {
    if (expiry.length !== 5) return false;
    const [month, year] = expiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt('20' + year);
    if (monthNum < 1 || monthNum > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    return true;
  };

  const validatePayment = () => {
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      Alert.alert('Invalid Card Number', 'Please enter a valid 16-digit card number');
      return false;
    }
    const validateCardNumber = (number) => {
  const cleaned = number.replace(/\s/g, '');
  return cleaned.length === 16;
}
    if (!cardHolder || cardHolder.trim().length < 3) {
      Alert.alert('Invalid Name', 'Please enter the cardholder name (minimum 3 characters)');
      return false;
    }
    if (!expiryDate || expiryDate.length !== 5 || !validateExpiry(expiryDate)) {
      Alert.alert('Invalid/Expired Card', 'Your card has expired or the date is invalid');
      return false;
    }
    if (!cvv || cvv.length !== 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid 3-digit CVV code');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    const cardLast4 = cardNumber.slice(-4);

    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to pay R${totalAmount} with card ending in ${cardLast4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setLoading(true);
            try {
              const userId = auth.currentUser.uid;

              const order = {
                userId,
                items: cart,
                total: totalAmount,
                paymentMethod: 'Card',
                cardLast4,
                cardHolder,
                status: 'paid',
                deliveryStatus: 'pending',
                timestamp: Date.now(),
              };

              await push(ref(db, 'orders'), order);

              const payment = {
                amount: totalAmount,
                cardLast4,
                cardHolder,
                method: 'Card',
                status: 'success',
                timestamp: Date.now(),
              };

              await push(ref(db, `payments/${userId}`), payment);

              await notifyUserByUID(
                userId,
                'Payment Successful',
                `Your payment of R${totalAmount} was successful! Your order is being processed.`
              );

              setLoading(false);

              Alert.alert(
                '✅ Payment Successful!',
                `R${totalAmount} has been paid successfully!\n\nCard: •••• ${cardLast4}\nOrder Status: Processing\n\nYour medicines will be delivered soon.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'PatientTabs' }],
                      });
                    },
                  },
                ]
              );

              
              setCardNumber('');
              setCardHolder('');
              setExpiryDate('');
              setCvv('');
            } catch (error) {
              setLoading(false);
              console.log('Payment error:', error);
              Alert.alert('Payment Failed', 'Something went wrong. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="card" size={40} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Payment Details</Text>
          <Text style={styles.headerSubtitle}>Enter your card information</Text>
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>R {totalAmount}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Card Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="card-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              keyboardType="numeric"
              maxLength={19}
              style={styles.input}
              placeholderTextColor={COLORS.lightGray}
            />
            {cardNumber.replace(/\s/g, '').length === 16 && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            )}
          </View>

          <Text style={styles.label}>Cardholder Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
            <TextInput
              placeholder="JOHN DOE"
              value={cardHolder}
              onChangeText={setCardHolder}
              autoCapitalize="characters"
              style={styles.input}
              placeholderTextColor={COLORS.lightGray}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Expiry Date</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiry(text))}
                  keyboardType="numeric"
                  maxLength={5}
                  style={styles.input}
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>CVV</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.lightGray} style={styles.inputIcon} />
                <TextInput
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor={COLORS.lightGray}
                />
              </View>
            </View>
          </View>

          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>Your payment information is secure and encrypted</Text>
          </View>

          {cart && cart.length > 0 && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {cart.map((item, index) => (
                <View key={index} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName}>{item.name} x{item.quantity}</Text>
                  <Text style={styles.summaryItemPrice}>R{item.price * item.quantity}</Text>
                </View>
              ))}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Total:</Text>
                <Text style={styles.summaryTotalValue}>R{totalAmount}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.payButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="card" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.payButtonText}>Pay R{totalAmount}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { alignItems: 'center', padding: SIZES.padding, paddingTop: 30, backgroundColor: COLORS.card, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginTop: 10 },
  headerSubtitle: { fontSize: 14, color: COLORS.lightGray, marginTop: 5 },
  amountCard: { backgroundColor: COLORS.primary, margin: SIZES.padding, padding: 20, borderRadius: SIZES.radius, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  amountLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 5 },
  amountValue: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  form: { paddingHorizontal: SIZES.padding },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 15, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.lightGray, paddingHorizontal: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 1, marginRight: 10 },
  securityInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 12, borderRadius: SIZES.radius, marginTop: 20, borderWidth: 1, borderColor: COLORS.success },
  securityText: { flex: 1, fontSize: 12, color: COLORS.text, marginLeft: 10 },
  summaryBox: { backgroundColor: COLORS.card, padding: 15, borderRadius: SIZES.radius, marginTop: 20, borderWidth: 1, borderColor: COLORS.lightGray },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItemName: { fontSize: 14, color: COLORS.text },
  summaryItemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  summaryDivider: { height: 1, backgroundColor: COLORS.lightGray, marginVertical: 10 },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryTotalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  summaryTotalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  payButton: { backgroundColor: COLORS.success, flexDirection: 'row', padding: 18, margin: SIZES.padding, marginTop: 30, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  payButtonDisabled: { backgroundColor: COLORS.lightGray },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { padding: 15, marginHorizontal: SIZES.padding, alignItems: 'center' },
  cancelButtonText: { color: COLORS.secondary, fontSize: 16, fontWeight: '600' },
});
