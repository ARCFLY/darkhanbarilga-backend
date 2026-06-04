import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { ChevronLeft, CreditCard, User, Mail, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';
import { propertyAPI } from '@/services/api';

const propertyTypes = ['apartment', 'house', 'villa', 'office', 'land', 'commercial', 'other'];
const listingTypes = ['sale', 'rent'];

export default function CreatePropertyScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('token');
      setToken(stored || '');
    })();
  }, []);

  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: 'apartment',
    listingType: 'sale',
    price: '',
    currency: 'MNT',
    priceNegotiable: false,
    rooms: '',
    bedrooms: '0',
    bathrooms: '0',
    floorNumber: '',
    totalFloors: '',
    sizeSqm: '',
    yearBuilt: '',
    district: '',
    city: 'Улаанбаатар',
    streetAddress: '',
    images: [] as string[],
    status: 'available',
  });

  const onChange = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (!form.title || !form.price || !form.sizeSqm) {
        return Alert.alert('Алдаа', 'Гарчиг, үнэ, талбай бүхэн заавал.');
      }
      setSaving(true);

      const body: any = {
        title: form.title,
        description: form.description,
        propertyType: form.propertyType,
        listingType: form.listingType,
        price: Number(form.price),
        currency: form.currency,
        priceNegotiable: form.priceNegotiable,
        rooms: Number(form.rooms || 0),
        bedrooms: Number(form.bedrooms || 0),
        bathrooms: Number(form.bathrooms || 0),
        floorNumber: form.floorNumber ? Number(form.floorNumber) : null,
        totalFloors: form.totalFloors ? Number(form.totalFloors) : null,
        sizeSqm: Number(form.sizeSqm),
        yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
        location: {
          country: 'Mongolia',
          city: form.city,
          district: form.district,
          streetAddress: form.streetAddress || null,
        },
        images: form.images.length
          ? form.images
          : [{ url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600', isPrimary: true }],
        status: form.status,
      };

      await propertyAPI.create(body);

      Alert.alert('Амжилттай', 'Зар үүслээ', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Алдаа', e.message || 'Зар үүсгэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Шинэ зар нэмэх</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          {[
            { label: 'Гарчиг', key: 'title', value: form.title, placeholder: 'Гарчиг' },
            { label: 'Тайлбар', key: 'description', value: form.description, placeholder: 'Тайлбар', multiline: true },
            { label: 'Үнэ', key: 'price', value: form.price, placeholder: 'Үнэ', keyboardType: 'numeric' },
            { label: 'Талбай (м²)', key: 'sizeSqm', value: form.sizeSqm, placeholder: 'Талбай', keyboardType: 'numeric' },
            { label: 'Дүүрэг', key: 'district', value: form.district, placeholder: 'Дүүрэг' },
            { label: 'Хаяг', key: 'streetAddress', value: form.streetAddress, placeholder: 'Хаяг' },
          ].map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={[styles.input, (field as any).multiline ? { height: 100, textAlignVertical: 'top' } : {}]}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                value={field.value as string}
                onChangeText={(v) => onChange(field.key as any, v)}
                multiline={!!(field as any).multiline}
                keyboardType={(field as any).keyboardType}
              />
            </View>
          ))}

          <Pressable onPress={handleSubmit} style={[styles.submitBtn, saving && { opacity: 0.6 }]} disabled={saving}>
            <Text style={styles.submitBtnText}>{saving ? 'Хадгалж байна...' : 'Зар үүсгэх'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  form: { gap: 12, marginTop: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
