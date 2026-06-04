import React, { useState } from 'react';
import {
  Dimensions, Image, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Heart, MapPin, BedDouble, Bath, Maximize } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { Property } from '@/data/properties';

const { width: W } = Dimensions.get('window');

function formatPrice(p: number) {
  if (p >= 1000000000) return (p / 1000000000).toFixed(1) + ' тэрбум ₮';
  if (p >= 1000000) return (p / 1000000).toFixed(0) + ' сая ₮';
  return p.toLocaleString() + ' ₮';
}

interface Props {
  property: Property;
  onPress?: (p: Property) => void;
}

export default function PropertyCard({ property, onPress }: Props) {
  const [liked, setLiked] = useState(false);

  const images = Array.isArray(property.images)
    ? property.images.map((i: any) => typeof i === 'string' ? i : i.url)
    : [];

  const area = property.area || property.sizeSqm || 0;
  const agentName = property.agent?.name || 'Зуучлагч';
  const agentAvatar = property.agent?.avatar || '';
  const location = property.location || '';

  return (
    <Pressable onPress={() => onPress?.(property)} style={styles.card}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: images[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600' }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Price */}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formatPrice(property.price)}</Text>
        </View>
        {/* Badges */}
        <View style={styles.badges}>
          {property.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>Шинэ</Text></View>}
          {property.isFeatured && <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>Онцлох</Text></View>}
        </View>
        {/* Like */}
        <Pressable onPress={() => setLiked(p => !p)} style={styles.likeBtn}>
          <Heart size={18} color={liked ? Colors.accent : Colors.white} fill={liked ? Colors.accent : 'transparent'} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <View style={styles.locationRow}>
          <MapPin size={13} color={Colors.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>

        {/* Specs */}
        <View style={styles.specs}>
          <View style={styles.spec}>
            <BedDouble size={15} color={Colors.textSecondary} />
            <Text style={styles.specText}>{property.rooms} өрөө</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.spec}>
            <Bath size={15} color={Colors.textSecondary} />
            <Text style={styles.specText}>{property.bathrooms} ариун цэвэр</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.spec}>
            <Maximize size={15} color={Colors.textSecondary} />
            <Text style={styles.specText}>{area}м²</Text>
          </View>
        </View>

        {/* Agent */}
        <View style={styles.agentRow}>
          {agentAvatar ? (
            <Image source={{ uri: agentAvatar }} style={styles.agentAvatar} />
          ) : (
            <View style={[styles.agentAvatar, { backgroundColor: Colors.accentLight }]} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>{agentName}</Text>
            <Text style={styles.agentRole}>Гэрчилгэээт зуучлал</Text>
          </View>
          {property.floor && property.totalFloors && (
            <View style={styles.floorTag}>
              <Text style={styles.floorText}>{property.floor}/{property.totalFloors} давхар</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: Colors.white, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: { width: '100%', height: 220, backgroundColor: Colors.surface },
  image: { width: '100%', height: 220 },
  priceTag: { position: 'absolute', top: 12, left: 12, backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  badges: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 6 },
  newBadge: { backgroundColor: Colors.goldLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  newBadgeText: { color: Colors.gold, fontSize: 11, fontWeight: '600' },
  featuredBadge: { backgroundColor: Colors.accentLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  featuredBadgeText: { color: Colors.accent, fontSize: 11, fontWeight: '600' },
  likeBtn: { position: 'absolute', top: 48, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 14, gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: Colors.textMuted, flex: 1 },
  specs: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specDivider: { width: 1, height: 14, backgroundColor: Colors.borderLight },
  specText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  agentAvatar: { width: 34, height: 34, borderRadius: 17 },
  agentName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  agentRole: { fontSize: 11, color: Colors.textMuted },
  floorTag: { backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  floorText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
});
