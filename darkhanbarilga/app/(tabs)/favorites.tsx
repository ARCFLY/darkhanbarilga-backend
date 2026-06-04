import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Heart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import PropertyCard from '@/components/PropertyCard';

type Property = {
  _id?: string;
  id?: string;
  title: string;
  price: number;
  location?: string;
  district?: string;
  rooms: number;
  bathrooms: number;
  area?: number;
  images: string[];
};

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('favorites');
        const parsed: Property[] = raw ? JSON.parse(raw) : [];
        setFavorites(parsed);
      } catch {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const remove = async (id: string) => {
    const next = favorites.filter((item) => (item._id || item.id) !== id);
    setFavorites(next);
    await AsyncStorage.setItem('favorites', JSON.stringify(next));
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Heart size={48} color={Colors.border} />
      <Text style={styles.emptyTitle}>Хадгалсан зар байхгүй</Text>
      <Text style={styles.emptyText}>
        Та хайлтын дэлгэцээс зүүлэг дээр дарж хадгалах зарыг сонгоно уу.
      </Text>
      <Pressable style={styles.exploreBtn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.exploreBtnText}>Хайлтыг нээх</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Хадгалсан заруудыг ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Хадгалсан</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => (item._id || item.id || Math.random()).toString()}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Pressable
              onLongPress={() =>
                Alert.alert('Устгах', 'Хадгалсан зарыг устгах уу?', [
                  { text: 'Цуцлах', style: 'cancel' },
                  { text: 'Устгах', onPress: () => remove(item._id || item.id || ''), style: 'destructive' },
                ])
              }
            >
              <PropertyCard property={item} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  loadingText: { color: Colors.textMuted, marginTop: 12 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  exploreBtn: { marginTop: 16, backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  exploreBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
