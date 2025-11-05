import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, get, set, push, remove, update } from 'firebase/database';

const formatCardNumber = (value) =>
  value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (value) =>
  value.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d{1,2})?/, (_, m, y) => (y ? `${m}/${y}` : m));

const validateCard = ({ cardNumber, name, expiry, cvv }) => {
  const number = cardNumber.replace(/\s/g, '');
  const validNumber = number.length >= 13 && number.length <= 19;
  const validName = name.trim().length >= 2;
  const validExpiry = /^\d{2}\/\d{2}$/.test(expiry);
  const validCvv = /^\d{3,4}$/.test(cvv);
  return validNumber && validName && validExpiry && validCvv;
};

export default function MedicineCheckoutScreen({ navigation }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const cartRef = ref(db, `carts/${user.uid}`);
    get(cartRef).then(snap => {
      const data = snap.val() || {};
      const items = Object.values(data);
      setCart(items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + (Number(i.price || 0) * Number(i.qty || 1)), 0);
    const delivery = subtotal > 0 ? 40 : 0;
    const service = subtotal > 0 ? Math.round(subtotal * 0.03) : 0;
    const total = subtotal + delivery + service;
    return { subtotal, delivery, service, total };
  }, [cart]);

  const payNow = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Add medicines to cart first.');
      return;
    }
    const valid = validateCard({
      cardNumber,
      name: cardName,
      expiry: cardExpiry,
      cvv: cardCvv
    });
    if (!valid) {
      Alert.alert('Invalid Card', 'Please enter valid card details.');
      return;
    }

    setProcessing(true);
    try {
      // Create order
      const orderId = push(ref(db, `orders`)).key;
      const order = {
        id: orderId,
        userId: user.uid,
        items: cart,
        totals,
        status: 'paid',
        paidAt: Date.now(),
        paymentMethod: 'card',
        last4: cardNumber.replace(/\s/g, '').slice(-4),
      };
      await set(ref(db, `orders/${orderId}`), order);

      // Clear cart
      await set(ref(db, `carts/${user.uid}`), null);

      // Notification to patient
      const notifId = push(ref(db, `notifications/${user.uid}`)).key;
      const notification = {
        id: notifId,
        userId: user.uid,
        title: 'Medicine Purchase Successful',
        message: `You bought medicine worth R${totals.total}. Your order is being prepared.`,
        type: 'medicine_purchase',
        orderId,
        amount: totals.total,
        read: false,
        timestamp: Date.now()
      };
      await set(ref(db, `notifications/${user.uid}/${notifId}`), notification);

      Alert.alert(
        'Payment Successful',
        `Thank you! Payment of R${totals.total} received.`,
        [{ text: 'OK', onPress: () => navigation.navigate('PatientTabs', { screen: 'Home' }) }]
      );
    } catch (e) {
      console.error('Medicine payment error', e);
      Alert.alert('Payment Failed', 'Could not complete payment. Try again.');
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout - Medicine</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {cart.length === 0 ? (
          <Text style={styles.empty}>Your cart is empty.</Text>
        ) : (
          <>
            {cart.map((item) => (
              <View key={`${item.id}`} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name} x{item.qty || 1}</Text>
                <Text style={styles.itemAmount}>R{Number(item.price || 0) * Number(item.qty || 1)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.itemRow}><Text style={styles.dim}>Subtotal</Text><Text style={styles.dim}>R{totals.subtotal}</Text></View>
            <View style={styles.itemRow}><Text style={styles.dim}>Delivery</Text><Text style={styles.dim}>R{totals.delivery}</Text></View>
            <View style={styles.itemRow}><Text style={styles.dim}>Service fee</Text><Text style={styles.dim}>R{totals.service}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>R{totals.total}</Text></View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Payment</Text>
        <TextInput
          style={styles.input}
          placeholder="Name on card"
          placeholderTextColor={COLORS.lightGray}
          value={cardName}
          onChangeText={setCardName}
        />
        <TextInput
          style={styles.input}
          placeholder="Card number"
          keyboardType="numeric"
          placeholderTextColor={COLORS.lightGray}
          value={cardNumber}
          onChangeText={(t) => setCardNumber(formatCardNumber(t))}
          maxLength={19 + 3} // groups with spaces
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="MM/YY"
            keyboardType="numeric"
            placeholderTextColor={COLORS.lightGray}
            value={cardExpiry}
            onChangeText={(t) => setCardExpiry(formatExpiry(t))}
            maxLength={5}
          />
          <TextInput
            style={[styles.input, styles.half]}
            placeholder="CVV"
            keyboardType="numeric"
            placeholderTextColor={COLORS.lightGray}
            value={cardCvv}
            onChangeText={setCardCvv}
            secureTextEntry
            maxLength={4}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.payButton, processing && { opacity: 0.6 }]} 
        onPress={payNow}
        disabled={processing || cart.length === 0}
      >
        {processing ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.payText}>Pay R{totals.total}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 10, color: COLORS.text },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginLeft: 12 },
  section: { backgroundColor: COLORS.card, margin: 15, padding: 15, borderRadius: SIZES.radius },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  empty: { color: COLORS.lightGray, fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { color: COLORS.text },
  itemAmount: { color: COLORS.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.background, marginVertical: 10 },
  dim: { color: COLORS.lightGray },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  input: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 12, color: COLORS.text, borderWidth: 1, borderColor: COLORS.lightGray, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  payButton: { margin: 15, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: SIZES.radius, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  payText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
