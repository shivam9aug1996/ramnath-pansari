import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useDeleteAdminUserMutation,
  useGetAdminUserQuery,
  useUpdateAdminUserMutation,
} from '@/redux/features/adminUserSlice';
import { Colors } from '@/constants/Colors';
import HeaderBar from '@/app/admin/components/HeaderBar';

const UserDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);

  const { data, isLoading, refetch } = useGetAdminUserQuery({ id });
  const [updateUser, { isLoading: isSaving }] = useUpdateAdminUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation();

  const [name, setName] = useState('');
  const [khataUrl, setKhataUrl] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (data?.user) {
      setName(data.user.name ?? '');
      setKhataUrl(data.user.khataUrl ?? '');
      setIsAdminUser(data.user.isAdminUser);
    }
  }, [data?.user]);

  const onSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    try {
      await updateUser({
        id,
        body: {
          name: trimmedName,
          khataUrl: khataUrl.trim() || null,
          isAdminUser,
          ...(password.trim() ? { password: password.trim() } : {}),
        },
      }).unwrap();
      setPassword('');
      Alert.alert('Saved', 'User updated successfully');
      refetch();
    } catch (e: unknown) {
      const msg =
        (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
        'Failed to update user';
      Alert.alert('Error', msg);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete user',
      'This permanently removes the user and their orders, cart, and addresses. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser({ id }).unwrap();
              Alert.alert('Deleted', 'User removed');
              router.back();
            } catch (e: unknown) {
              const msg =
                (e as { data?: { error?: { message?: string } } })?.data?.error?.message ||
                'Failed to delete user';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !data?.user) {
    return (
      <AdminScreen style={styles.container}>
        <HeaderBar title="User" />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.darkGreen} />
        </View>
      </AdminScreen>
    );
  }

  const user = data.user;

  return (
    <AdminScreen style={styles.container}>
      <HeaderBar title="Edit user" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Mobile</Text>
          <Text style={styles.infoValue}>{user.mobileNumber}</Text>
          {user.orderCount != null ? (
            <>
              <Text style={[styles.infoLabel, { marginTop: 12 }]}>Orders</Text>
              <Text style={styles.infoValue}>{user.orderCount}</Text>
            </>
          ) : null}
          {user.isGuestUser ? (
            <View style={styles.guestBanner}>
              <Text style={styles.guestBannerText}>Guest account</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Display name"
          style={styles.input}
        />

        <Text style={styles.label}>Khata URL (optional)</Text>
        <TextInput
          value={khataUrl}
          onChangeText={setKhataUrl}
          placeholder="https://..."
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>New password (optional)</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Leave blank to keep current"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
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

        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={isSaving || isDeleting}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteBtn, isDeleting && styles.saveBtnDisabled]}
          onPress={onDelete}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={Colors.light.gradientRed_1} />
          ) : (
            <Text style={styles.deleteBtnText}>Delete user</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </AdminScreen>
  );
};

export default UserDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  guestBanner: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  guestBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
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
  deleteBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: Colors.light.gradientRed_1,
    fontWeight: '800',
    fontSize: 15,
  },
});
