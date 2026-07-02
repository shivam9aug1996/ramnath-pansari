import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AdminScreen from '@/app/admin/components/AdminScreen';
import { useRouter } from 'expo-router';
import { useCreateAdminUserMutation } from '@/redux/features/adminUserSlice';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';

const CreateUserScreen = () => {
  const router = useRouter();
  const [createUser, { isLoading }] = useCreateAdminUserMutation();

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isDriverUser, setIsDriverUser] = useState(false);

  const onSubmit = async () => {
    const mobile = mobileNumber.trim();
    if (!/^\d{10}$/.test(mobile)) {
      Alert.alert('Validation', 'Enter a valid 10-digit mobile number');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Validation', 'Password must be at least 4 characters');
      return;
    }

    try {
      await createUser({
        mobileNumber: mobile,
        password,
        name: name.trim() || undefined,
        isAdminUser,
        isDriverUser,
      }).unwrap();
      Alert.alert('Created', 'User added successfully');
      router.back();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to create user';
      Alert.alert('Error', msg);
    }
  };

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="New user" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          value={mobileNumber}
          onChangeText={setMobileNumber}
          placeholder="10-digit mobile"
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
          autoFocus
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Min 4 characters"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Name (optional)</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Display name"
          style={styles.input}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Admin access</Text>
            <Text style={styles.switchHint}>Can open the admin dashboard</Text>
          </View>
          <Switch
            value={isAdminUser}
            onValueChange={setIsAdminUser}
            trackColor={{ false: '#E2E8F0', true: Colors.light.gradientGreen_2 }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Driver access</Text>
            <Text style={styles.switchHint}>Can open the driver delivery app</Text>
          </View>
          <Switch
            value={isDriverUser}
            onValueChange={setIsDriverUser}
            trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Create user</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </AdminScreen>
  );
};

export default CreateUserScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#111827',
  },
  switchRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  switchHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  saveBtn: {
    marginTop: 24,
    backgroundColor: Colors.light.darkGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
