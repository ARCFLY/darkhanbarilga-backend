import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { ChevronLeft, Eye, Pencil, Trash2, Plus, Building2, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { propertyAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

function formatPrice(p: number) {
  if (p >= 1000000000) return (p / 1000000000).toFixed(1) + ' тэрбум ₮';
  if (p >= 1000000) return (p / 1000000).toFixed(0) + ' сая ₮';
  return p.toLocaleString() + ' ₮';
}

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Бэлэн', color: Colors.accent, bg: Colors.accentLight },
  sold: { label: 'Зарагдсан', color: Colors.gold, bg: Colors.goldLight },
  rented: { label: 'Түрээслэгдсэн', color: '#6366F1', bg: '#EEF2FF' },
};

export default function AgentListingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await propertyAPI.getMyListings();
        setListings(res.data.properties);
      } catch (e) { console.log(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Зар устгах', 'Та энэ зарыг устгахдаа итгэлтэй байна уу?', [
      { text: 'Цуцлах', style: 'cancel' },
      { text: 'Устгах', style: 'destructive', onPress: async () => {
        try {
          await propertyAPI.delete(id);
          setListings(prev => prev.filter(l => (l._id || l.id) !== id));
        } catch (e: any) { Alert.alert('Алдаа', e.message); }
      }},
    ]);
  };

  const stats = {
    active: listings.filter(l => l.status === 'available').length,
    sold: listings.filter(l => l.status === 'sold').length,
    rented: listings.filter(l => l.status === 'rented').length,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Миний зарууд</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Agent info */}
          <View style={styles.agentHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
            </View>
            <View>
              <Text style={styles.agentName}>{user?.lastName}. {user?.firstName}</Text>
              <Text style={styles.agentRole}>Гэрчилгэээт зуучлал</Text>
            </View>
          </View>

          {/* Stats */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
            {[
              { icon: <Building2 size={18} color={Colors.accent} />, value: stats.active, label: 'Идэвхтэй', color: Colors.accent },
              { icon: <TrendingUp size={18} color={Colors.gold} />, value: stats.sold, label: 'Зарагдсан', color: Colors.gold },
              { icon: <Eye size={18} color='#6366F1' />, value: stats.rented, label: 'Түрээслэгдсэн', color: '#6366F1' },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { borderLeftColor: s.color }]}>
                {s.icon}
                <Text style={styles.statNumber}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Listings */}
          <Text style={styles.sectionTitle}>Зарууд ({listings.length})</Text>

          {listings.length === 0 ? (
            <View style={styles.empty}>
              <Building2 size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>Одоогоор зар байхгүй</Text>
              <Text style={styles.emptyText}>Шинэ зар нэмж эхлээрэй</Text>
            </View>
          ) : (
            listings.map(item => {
              const images = Array.isArray(item.images)
                ? item.images.map((i: any) => typeof i === 'string' ? i : i.url)
                : [];
              const statusInfo = statusLabel[item.status] || statusLabel.available;
              return (
                <View key={item._id || item.id} style={styles.listingCard}>
                  <View style={styles.cardRow}>
                    <Image source={{ uri: images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200' }} style={styles.thumb} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.listingTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.listingPrice}>{formatPrice(item.price)}</Text>
                      <Text style={styles.listingLocation} numberOfLines={1}>{item.location || ''}</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Pressable onPress={() => router.push({ pathname: '/property/[id]', params: { id: item._id || item.id } })} style={styles.actionBtn}>
                      <Eye size={15} color={Colors.textSecondary} />
                      <Text style={styles.actionText}>Харах</Text>
                    </Pressable>
                    <View style={styles.actionDivider} />
                    <Pressable style={styles.actionBtn}>
                      <Pencil size={15} color={Colors.accent} />
                      <Text style={[styles.actionText, { color: Colors.accent }]}>Засах</Text>
                    </Pressable>
                    <View style={styles.actionDivider} />
                    <Pressable onPress={() => handleDelete(item._id || item.id)} style={styles.actionBtn}>
                      <Trash2 size={15} color={Colors.red} />
                      <Text style={[styles.actionText, { color: Colors.red }]}>Устгах</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
        onPress={() => router.push('/agent/create-listing' as any)}
      >
        <Plus size={24} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, gap: 16, paddingBottom: 100 },
  agentHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.accent },
  agentName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  agentRole: { fontSize: 13, color: Colors.textMuted },
  statsScroll: { marginHorizontal: -16 },
  statCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginLeft: 16, minWidth: 130, borderLeftWidth: 3, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statNumber: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  listingCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', gap: 12 },
  thumb: { width: 88, height: 88, borderRadius: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  listingTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  listingPrice: { fontSize: 15, fontWeight: '800', color: Colors.accent },
  listingLocation: { fontSize: 12, color: Colors.textMuted },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  actionDivider: { width: 1, height: 20, backgroundColor: Colors.borderLight },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
});
