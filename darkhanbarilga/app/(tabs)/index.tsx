import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Keyboard, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { districts, Property } from '@/data/properties';
import { propertyAPI } from '@/services/api';
import PropertyCard from '@/components/PropertyCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (selectedDistrict) params.district = selectedDistrict;
      const res = await propertyAPI.getAll(params);
      setProperties(res.data.properties);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error('Failed to fetch properties', err);
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDistrict]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 400);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Орон сууц хайх</Text>
      <Text style={styles.subtitle}>{total} зар олдлоо</Text>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Байршил, дүүрэг, гарчиг..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={Keyboard.dismiss}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <X size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Districts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.districts}>
        {districts.map(d => (
          <Pressable
            key={d}
            onPress={() => setSelectedDistrict(prev => prev === d ? null : d)}
            style={[styles.chip, selectedDistrict === d && styles.chipActive]}
          >
            <MapPin size={13} color={selectedDistrict === d ? Colors.white : Colors.textMuted} />
            <Text style={[styles.chipText, selectedDistrict === d && styles.chipTextActive]}>{d}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={properties}
        keyExtractor={item => item._id || item.id || Math.random().toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => router.push({ pathname: '/property/[id]', params: { id: item._id || item.id || Math.random().toString() } })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
            : <View style={styles.empty}>
                <Text style={styles.emptyText}>Зар олдсонгүй</Text>
              </View>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, paddingTop: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  districts: { marginHorizontal: -16, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight,
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 16, color: Colors.textMuted },
});
