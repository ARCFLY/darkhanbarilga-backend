import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MapPin, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { propertyAPI } from '@/services/api';
import { mockProperties, districts, Property } from '@/data/properties';
import PropertyCard from '@/components/PropertyCard';

export default function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [listingType, setListingType] = useState<'sale' | 'rent' | null>(null);
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [loading, setLoading] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (district) params.district = district;
      if (listingType) params.listingType = listingType;
      const res = await propertyAPI.getAll(params);
      if (Array.isArray(res.data.properties)) setProperties(res.data.properties);
    } catch {
      let result = [...mockProperties];
      const q = search.trim().toLowerCase();
      if (q) result = result.filter(p => p.title.toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q));
      if (district) result = result.filter(p => p.district === district);
      if (listingType) result = result.filter(p => p.listingType === listingType || !p.listingType);
      setProperties(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchProperties, 400);
    return () => clearTimeout(t);
  }, [search, district, listingType]);

  return (
    <View style={[styles.container]}>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <MapPin size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Байршил, дүүрэг, гарчиг..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          )}
        </View>
        <Pressable style={styles.filterBtn}>
          <SlidersHorizontal size={18} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* Type chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {(['sale', 'rent'] as const).map(type => (
          <Pressable
            key={type}
            onPress={() => setListingType(prev => prev === type ? null : type)}
            style={[styles.chip, listingType === type && styles.chipActive]}
          >
            <Text style={[styles.chipText, listingType === type && styles.chipTextActive]}>
              {type === 'sale' ? 'Борлуулалт' : 'Түрээс'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* District chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {districts.map(d => (
          <Pressable
            key={d}
            onPress={() => setDistrict(prev => prev === d ? null : d)}
            style={[styles.chip, district === d && styles.chipActive]}
          >
            <Text style={[styles.chipText, district === d && styles.chipTextActive]}>{d}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Featured sections */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Онцлох зар</Text>
          <Pressable onPress={() => router.push('/(tabs)')}>
            <Text style={styles.seeAll}>Бүгдийг харах</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {properties.filter(p => p.isFeatured).slice(0, 6).map(item => (
            <Pressable key={item._id || item.id} onPress={() => router.push({ pathname: '/property/[id]', params: { id: (item._id || item.id || Math.random().toString()) as string } })}>
              <PropertyCard property={item} />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Шинэ зар</Text>
          <Pressable onPress={() => router.push('/(tabs)')}>
            <Text style={styles.seeAll}>Бүгдийг харах</Text>
          </Pressable>
        </View>
        {loading ? (
          <Text style={styles.muted}>Ачааллаж байна...</Text>
        ) : (
          <FlatList
            data={properties.filter(p => p.isNew).length ? properties.filter(p => p.isNew) : properties.slice(0, 8)}
            keyExtractor={item => (item._id || item.id || Math.random()).toString()}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push({ pathname: '/property/[id]', params: { id: (item._id || item.id || Math.random().toString()) as string } })}>
                <PropertyCard property={item} />
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.muted}>Зар олдсонгүй</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.borderLight },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  clearText: { fontSize: 18, color: Colors.textMuted, paddingHorizontal: 4 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 4, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, marginRight: 8 },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  muted: { fontSize: 14, color: Colors.textMuted },
});
