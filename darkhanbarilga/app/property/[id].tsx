import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Pressable,
  ScrollView, StyleSheet, Text, View, Image,
} from 'react-native';
import { ChevronLeft, Heart, MapPin, BedDouble, Bath, Maximize, Building, Phone, MessageCircle, Check } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { mockProperties } from '@/data/properties';
import { propertyAPI, appointmentAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

function formatPrice(p: number) {
  if (p >= 1000000000) return (p / 1000000000).toFixed(1) + ' тэрбум ₮';
  if (p >= 1000000) return (p / 1000000).toFixed(0) + ' сая ₮';
  return p.toLocaleString() + ' ₮';
}

const features = ['Барилгын тусгай зөвшөөрөлтэй', 'Дулаан ханын тусгаарлалт', 'Цонхны хуванцар хүрээ', 'Лифтэй', 'Доорши граж', 'Харуул хамгаалалт'];

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await propertyAPI.getById(id);
        setProperty(res.data.property);
      } catch {
        const found = mockProperties.find(p => p.id === id || p._id === id);
        setProperty(found || null);
      } finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    const syncFav = async () => {
      try {
        const raw = await AsyncStorage.getItem('favorites');
        const list: any[] = raw ? JSON.parse(raw) : [];
        setLiked(list.some((item) => (item._id || item.id) === id));
      } catch { /* ignore */ }
    };
    syncFav();
  }, [id]);

  const toggleFavorite = async () => {
    try {
      const raw = await AsyncStorage.getItem('favorites');
      const list: any[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((item) => (item._id || item.id) === id);
      let next;
      if (idx >= 0) {
        next = list.filter((item) => (item._id || item.id) !== id);
      } else if (property) {
        const entry = { _id: property._id || property.id, title: property.title, price: property.price, images: property.images, location: property.location };
        next = [...list, entry];
      } else {
        next = list;
      }
      await AsyncStorage.setItem('favorites', JSON.stringify(next));
      setLiked(idx < 0);
    } catch { /* ignore */ }
  };

  const handleBook = () => {
    if (!isAuthenticated) {
      Alert.alert('Нэвтрэх шаардлагатай', 'Цаг захиалахын тулд нэвтэрнэ үү', [
        { text: 'Цуцлах', style: 'cancel' },
        { text: 'Нэвтрэх', onPress: () => router.push('/auth') },
      ]);
      return;
    }
    Alert.alert('Цаг захиалах', 'Та энэ байрыг үзэхийг хүсэж байна уу?', [
      { text: 'Цуцлах', style: 'cancel' },
      { text: 'Захиалах', onPress: async () => {
        setBooking(true);
        try {
          const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
          await appointmentAPI.book({ propertyId: property._id || property.id, requestedDate: d.toISOString(), meetingType: 'in_person' });
          Alert.alert('Амжилттай', 'Цаг захиалга илгээгдлээ. Агент тантай холбогдоно.');
        } catch (e: any) { Alert.alert('Алдаа', e.message); }
        finally { setBooking(false); }
      }},
    ]);
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  if (!property) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}><ChevronLeft size={24} color={Colors.textPrimary} /></Pressable>
      <Text style={styles.errorText}>Зар олдсонгүй</Text>
    </View>
  );

  const images = Array.isArray(property.images) ? property.images.map((i: any) => typeof i === 'string' ? i : i.url) : [];
  const area = property.area || property.sizeSqm || 0;
  const agentName = property.agent?.name || (property.assignedAgent ? `${property.assignedAgent.firstName} ${property.assignedAgent.lastName}` : 'Зуучлагч');
  const agentPhone = property.agent?.phone || property.assignedAgent?.phone || '';
  const agentAvatar = property.agent?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
  const locationText = typeof property.location === 'string' ? property.location : property.location ? `${property.location.district}, ${property.location.city}` : '';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ width: W, height: W * 0.7 }}>
          <Image source={{ uri: images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600' }} style={{ width: W, height: W * 0.7 }} resizeMode="cover" />
          <View style={[styles.topActions, { top: insets.top + 12 }]}>
            <Pressable onPress={() => router.back()} style={styles.actionBtn}><ChevronLeft size={22} color={Colors.textPrimary} /></Pressable>
            <Pressable onPress={toggleFavorite} style={styles.actionBtn}>
              <Heart size={20} color={liked ? Colors.accent : Colors.textPrimary} fill={liked ? Colors.accent : 'transparent'} />
            </Pressable>
          </View>
          <View style={styles.priceTag}><Text style={styles.priceTagText}>{formatPrice(property.price)}</Text></View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{property.title}</Text>
          {locationText ? <View style={styles.locationRow}><MapPin size={16} color={Colors.accent} /><Text style={styles.locationText}>{locationText}</Text></View> : null}

          {/* Specs */}
          <View style={styles.specs}>
            {[
              { icon: <BedDouble size={20} color={Colors.accent} />, value: property.rooms, label: 'Өрөө' },
              { icon: <Bath size={20} color={Colors.accent} />, value: property.bathrooms, label: 'Ариун цэвэр' },
              { icon: <Maximize size={20} color={Colors.accent} />, value: area, label: 'м²' },
              { icon: <Building size={20} color={Colors.accent} />, value: property.totalFloors || '—', label: 'Давхар' },
            ].map((s, i) => (
              <View key={i} style={styles.specCard}>
                {s.icon}
                <Text style={styles.specValue}>{s.value}</Text>
                <Text style={styles.specLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {property.description ? <View><Text style={styles.sectionTitle}>Тайлбар</Text><Text style={styles.desc}>{property.description}</Text></View> : null}

          {/* Features */}
          <Text style={styles.sectionTitle}>Онцлог шинж чанарууд</Text>
          <View style={styles.features}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <Check size={14} color={Colors.accent} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Agent */}
          <Text style={styles.sectionTitle}>Зуучлагч</Text>
          <View style={styles.agentCard}>
            <Image source={{ uri: agentAvatar }} style={styles.agentAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{agentName}</Text>
              <Text style={styles.agentRole}>Гэрчилгэээт зуучлал</Text>
              {agentPhone ? <Text style={styles.agentPhone}>{agentPhone}</Text> : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.priceLabel}>Үнэ</Text>
          <Text style={styles.priceValue}>{formatPrice(property.price)}</Text>
        </View>
        <Pressable onPress={handleBook} style={[styles.bookBtn, booking && { opacity: 0.6 }]} disabled={booking}>
          <Phone size={18} color={Colors.white} />
          <Text style={styles.bookBtnText}>{booking ? 'Захиалж байна...' : 'Цаг захиалах'}</Text>
        </Pressable>
        <Pressable style={styles.msgBtn}><MessageCircle size={20} color={Colors.accent} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorText: { textAlign: 'center', marginTop: 40, color: Colors.textSecondary },
  backBtn: { margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  topActions: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  priceTag: { position: 'absolute', bottom: 16, left: 16, backgroundColor: Colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  priceTagText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { fontSize: 14, color: Colors.textSecondary },
  specs: { flexDirection: 'row', gap: 10 },
  specCard: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: Colors.surface, borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: Colors.borderLight },
  specValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  specLabel: { fontSize: 12, color: Colors.textMuted },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  desc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  featureText: { fontSize: 13, color: Colors.accentDark, fontWeight: '500' },
  agentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  agentAvatar: { width: 56, height: 56, borderRadius: 28 },
  agentName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  agentRole: { fontSize: 13, color: Colors.textMuted },
  agentPhone: { fontSize: 14, color: Colors.accent, fontWeight: '600', marginTop: 2 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  priceLabel: { fontSize: 12, color: Colors.textMuted },
  priceValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  bookBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  msgBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
});
