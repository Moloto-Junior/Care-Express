import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';

export default function SetConsultationFeeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicFee, setClinicFee] = useState('');
  const [homeFee, setHomeFee] = useState('');
  const [availableForHomeVisits, setAvailableForHomeVisits] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('limpopo');

  const BRANCHES = {
    limpopo: { name: 'Limpopo Polokwane Clinic', location: 'Polokwane, Limpopo' },
    johannesburg: { name: 'Johannesburg Braamfontein Clinic', location: 'Braamfontein, Johannesburg' }
  };

  useEffect(() => {
    loadCurrentFees();
  }, []);

  const loadCurrentFees = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const feesSnapshot = await get(ref(db, `doctors/${user.uid}/fees`));
      if (feesSnapshot.exists()) {
        const fees = feesSnapshot.val();
        setClinicFee(fees.consultationFee?.toString() || '');
        setHomeFee(fees.homeVisitFee?.toString() || '');
        setAvailableForHomeVisits(fees.availableForHomeVisits !== undefined ? fees.availableForHomeVisits : true);
        setSelectedBranch(fees.doctorBranch || 'limpopo');
      }
    } catch (error) {
      console.error('Error loading fees:', error);
    }
    setLoading(false);
  };

  const saveFees = async () => {
    if (!clinicFee || !homeFee) {
      Alert.alert('Missing Information', 'Please enter both clinic and home visit fees.');
      return;
    }

    const clinicAmount = parseInt(clinicFee);
    const homeAmount = parseInt(homeFee);

    if (clinicAmount < 50 || homeAmount < 50) {
      Alert.alert('Invalid Amount', 'Fees must be at least R50.');
      return;
    }

    if (clinicAmount > 2000 || homeAmount > 5000) {
      Alert.alert('Amount Too High', 'Please enter reasonable consultation fees.');
      return;
    }

    setSaving(true);

    try {
      const user = auth.currentUser;
      const feesData = {
        consultationFee: clinicAmount,
        homeVisitFee: homeAmount,
        availableForHomeVisits,
        doctorBranch: selectedBranch,
        lastUpdated: Date.now()
      };

      await set(ref(db, `doctors/${user.uid}/fees`), feesData);

      Alert.alert(
        'Fees Updated Successfully!',
        `Your consultation fees have been set:\n\n🏥 Clinic Visit: R${clinicAmount}\n🏠 Home Visit: ${availableForHomeVisits ? `R${homeAmount} + travel` : 'Not Available'}\n📍 Primary Branch: ${BRANCHES[selectedBranch].name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Error saving fees:', error);
      Alert.alert('Error', 'Failed to save fees. Please try again.');
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading current fees...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Set Consultation Fees</Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Set your consultation fees for both clinic visits and home visits. Patients will see these fees when booking appointments.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Primary Branch</Text>
        <Text style={styles.sectionSubtitle}>Select your main working location</Text>

        {Object.entries(BRANCHES).map(([key, branch]) => (
          <TouchableOpacity
            key={`branch-${key}`}
            style={[
              styles.branchOption,
              selectedBranch === key && styles.selectedBranchOption
            ]}
            onPress={() => setSelectedBranch(key)}
          >
            <View style={styles.branchContent}>
              <Ionicons 
                name="business" 
                size={24} 
                color={selectedBranch === key ? 'white' : COLORS.primary} 
              />
              <View style={styles.branchInfo}>
                <Text style={[
                  styles.branchName,
                  selectedBranch === key && styles.selectedBranchText
                ]}>
                  {branch.name}
                </Text>
                <Text style={[
                  styles.branchLocation,
                  selectedBranch === key && styles.selectedBranchText
                ]}>
                  📍 {branch.location}
                </Text>
              </View>
              {selectedBranch === key && (
                <Ionicons name="checkmark-circle" size={24} color="white" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consultation Fees</Text>
        
        <View style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <Ionicons name="business" size={24} color={COLORS.primary} />
            <Text style={styles.feeTitle}>In-Clinic Consultation</Text>
          </View>
          <Text style={styles.feeDescription}>
            Fee for patients visiting you at {BRANCHES[selectedBranch]?.name}
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fee Amount (R)</Text>
            <TextInput
              style={styles.feeInput}
              placeholder="300"
              placeholderTextColor={COLORS.lightGray}
              value={clinicFee}
              onChangeText={setClinicFee}
              keyboardType="numeric"
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.feeCard}>
          <View style={styles.feeHeader}>
            <Ionicons name="home" size={24} color={COLORS.success} />
            <Text style={styles.feeTitle}>Home Visit Consultation</Text>
            <Switch
              value={availableForHomeVisits}
              onValueChange={setAvailableForHomeVisits}
              trackColor={{ false: COLORS.lightGray, true: COLORS.success }}
              thumbColor={availableForHomeVisits ? 'white' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.feeDescription}>
            {availableForHomeVisits 
              ? 'Fee for visiting patients at their location (+ travel charges)'
              : 'Toggle to enable home visits for your patients'}
          </Text>
          {availableForHomeVisits && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Base Home Visit Fee (R)</Text>
              <TextInput
                style={styles.feeInput}
                placeholder="500"
                placeholderTextColor={COLORS.lightGray}
                value={homeFee}
                onChangeText={setHomeFee}
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.feeNote}>
                💡 Travel charges (R50 per 2km) will be added automatically based on distance
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>Fee Preview</Text>
        <View style={styles.previewCard}>
          <Text style={styles.previewHeader}>Patients will see:</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>🏥 Clinic Visit:</Text>
            <Text style={styles.previewValue}>R{clinicFee || '0'}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>🏠 Home Visit:</Text>
            <Text style={styles.previewValue}>
              {availableForHomeVisits ? `R${homeFee || '0'} + travel` : 'Not Available'}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>📍 Your Branch:</Text>
            <Text style={styles.previewValue}>{BRANCHES[selectedBranch]?.name}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, saving && styles.savingButton]} 
        onPress={saveFees}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size={24} color="white" />
        ) : (
          <Ionicons name="save" size={24} color="white" />
        )}
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving Fees...' : 'Save Consultation Fees'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.text },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginLeft: 15 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.primary + '15', padding: 18, margin: 20, borderRadius: SIZES.radius, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  infoText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 20, marginLeft: 12 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, color: COLORS.lightGray, marginBottom: 15 },
  branchOption: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: COLORS.lightGray },
  selectedBranchOption: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  branchContent: { flexDirection: 'row', alignItems: 'center' },
  branchInfo: { flex: 1, marginLeft: 15 },
  branchName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  branchLocation: { fontSize: 14, color: COLORS.lightGray, marginTop: 3 },
  selectedBranchText: { color: 'white' },
  feeCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: SIZES.radius, marginBottom: 15, borderWidth: 2, borderColor: COLORS.lightGray },
  feeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  feeTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, flex: 1, marginLeft: 12 },
  feeDescription: { fontSize: 14, color: COLORS.lightGray, lineHeight: 20, marginBottom: 15 },
  inputContainer: { marginTop: 5 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  feeInput: { backgroundColor: COLORS.background, borderRadius: SIZES.radius, padding: 15, fontSize: 18, fontWeight: 'bold', color: COLORS.text, borderWidth: 2, borderColor: COLORS.primary, textAlign: 'center' },
  feeNote: { fontSize: 12, color: COLORS.lightGray, marginTop: 8, fontStyle: 'italic' },
  previewSection: { padding: 20 },
  previewTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  previewCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: SIZES.radius, borderWidth: 3, borderColor: COLORS.success },
  previewHeader: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 15, textAlign: 'center' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  previewLabel: { fontSize: 14, color: COLORS.text },
  previewValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  saveButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: SIZES.radius, margin: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
  savingButton: { opacity: 0.7 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
