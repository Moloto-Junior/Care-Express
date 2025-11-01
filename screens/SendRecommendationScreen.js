import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../Theme';
import { db, auth } from '../firebaseConfig';
import { ref, onValue, push, get } from 'firebase/database';
import { notifyUserByUID } from './NotificationsService';
import { Ionicons } from '@expo/vector-icons';

export default function SendRecommendationScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    const doctorId = auth.currentUser.uid;
    const doctorRef = ref(db, `users/${doctorId}`);
    
    get(doctorRef).then(snapshot => {
      if (snapshot.exists()) {
        setDoctorName(snapshot.val().name || 'Doctor');
      }
    });

    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const patientList = Object.keys(data)
          .filter(uid => data[uid].role === 'Patient')
          .map(uid => ({ id: uid, ...data[uid] }));
        setPatients(patientList);
      } else {
        setPatients([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendRecommendation = async () => {
    if (!selectedPatient) {
      Alert.alert('No Patient Selected', 'Please select a patient to send the recommendation to.');
      return;
    }

    if (!recommendation.trim()) {
      Alert.alert('Empty Recommendation', 'Please enter a recommendation message.');
      return;
    }

    if (recommendation.trim().length < 10) {
      Alert.alert('Too Short', 'Please enter a more detailed recommendation (at least 10 characters).');
      return;
    }

    setSending(true);

    try {
      const doctorId = auth.currentUser.uid;
      
      const recData = {
        doctorId,
        doctorName,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        recommendation: recommendation.trim(),
        timestamp: Date.now(),
        read: false,
      };

      await push(ref(db, `recommendations/${selectedPatient.id}`), recData);

      await notifyUserByUID(
        selectedPatient.id,
        'New Recommendation from Doctor',
        `Dr. ${doctorName} sent you a new health recommendation`
      );

      setSending(false);

      Alert.alert(
        '✅ Recommendation Sent!',
        `Your recommendation has been sent to ${selectedPatient.name} successfully.`,
        [
          {
            text: 'Send Another',
            onPress: () => {
              setSelectedPatient(null);
              setRecommendation('');
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      setSending(false);
      console.log('Send recommendation error:', error);
      Alert.alert('Error', 'Failed to send recommendation. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (patients.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={80} color={COLORS.lightGray} />
        <Text style={styles.emptyText}>No Patients Available</Text>
        <Text style={styles.emptySubText}>There are no registered patients yet</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="medical" size={40} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Send Health Recommendation</Text>
        <Text style={styles.headerSubtitle}>Select a patient and provide health advice</Text>
      </View>

      {selectedPatient && (
        <View style={styles.selectedPatientCard}>
          <View style={styles.selectedPatientHeader}>
            <Text style={styles.selectedPatientLabel}>Sending to:</Text>
            <TouchableOpacity onPress={() => setSelectedPatient(null)}>
              <Text style={styles.changeButton}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.selectedPatientInfo}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={30} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.selectedPatientName}>{selectedPatient.name}</Text>
              <Text style={styles.selectedPatientEmail}>{selectedPatient.email}</Text>
            </View>
          </View>
        </View>
      )}

      {!selectedPatient && (
        <>
          <Text style={styles.sectionTitle}>Select Patient:</Text>
          <FlatList
            data={patients}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.patientCard}
                onPress={() => setSelectedPatient(item)}
              >
                <View style={styles.patientAvatar}>
                  <Ionicons name="person" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientEmail}>{item.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.lightGray} />
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {selectedPatient && (
        <>
          <Text style={styles.sectionTitle}>Your Recommendation:</Text>
          <View style={styles.inputCard}>
            <TextInput
              placeholder="Enter your health recommendation for the patient..."
              value={recommendation}
              onChangeText={setRecommendation}
              multiline
              numberOfLines={8}
              style={styles.textArea}
              placeholderTextColor={COLORS.lightGray}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{recommendation.length} characters</Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Templates:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
            <TouchableOpacity
              style={styles.templateChip}
              onPress={() => setRecommendation('Please ensure you take your prescribed medication as directed. Drink plenty of water and get adequate rest.')}
            >
              <Text style={styles.templateText}>💊 Medication</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.templateChip}
              onPress={() => setRecommendation('I recommend you maintain a balanced diet rich in fruits and vegetables. Regular exercise for at least 30 minutes daily will be beneficial.')}
            >
              <Text style={styles.templateText}>🥗 Diet & Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.templateChip}
              onPress={() => setRecommendation('Please schedule a follow-up appointment in 2 weeks. Monitor your symptoms and contact me if they worsen.')}
            >
              <Text style={styles.templateText}>📅 Follow-up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.templateChip}
              onPress={() => setRecommendation('Ensure you get 7-8 hours of quality sleep each night. Avoid screen time 1 hour before bed for better rest.')}
            >
              <Text style={styles.templateText}>😴 Sleep</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSendRecommendation}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.sendButtonText}>Send Recommendation</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    padding: SIZES.padding,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 5,
    textAlign: 'center',
  },
  selectedPatientCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.padding,
    marginBottom: 20,
    padding: 15,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  selectedPatientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedPatientLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  changeButton: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedPatientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedPatientEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginHorizontal: SIZES.padding,
    marginBottom: 12,
    marginTop: 10,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 15,
    marginHorizontal: SIZES.padding,
    marginBottom: 10,
    borderRadius: SIZES.radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  patientEmail: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 2,
  },
  inputCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: SIZES.padding,
    padding: 15,
    borderRadius: SIZES.radius,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  textArea: {
    fontSize: 16,
    color: COLORS.text,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.lightGray,
    textAlign: 'right',
    marginTop: 5,
  },
  templatesContainer: {
    paddingHorizontal: SIZES.padding,
    marginBottom: 20,
  },
  templateChip: {
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  templateText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    padding: 18,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});