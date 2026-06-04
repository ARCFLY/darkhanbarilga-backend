import React from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import {
  User, Settings, LogOut, Building2, ChevronRight,
  LayoutDashboard, LogIn, Bell,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Гарах', 'Та гарахдаа итгэлтэй байна уу?', [
      { text: 'Цуцлах', style: 'cancel' },
      { text: 'Гарах', style: 'destructive', onPress: async () => { await logout(); router.replace('/auth'); } },
    ]);
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        <View style={styles.iconBox}><LogIn size={32} color={Colors.accent} /></View>
        <Text style={styles.notLoggedTitle}>Нэвтрээгүй байна</Text>
        <Text style={styles.notLoggedText}>Профайлаа харахын тулд нэвтэрнэ үү</Text>
        <Pressable onPress={() => router.push('/auth')} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>Нэвтрэх / Бүртгүүлэх</Text>
        </Pressable>
      </View>
    );
  }

  const isAgent = user.role === 'agent';
  const isAdmin = user.role === 'admin';

  const menu = [
    ...(isAgent || isAdmin ? [{ icon: <Building2 size={20} color={Colors.accent} />, label: 'Миний зарууд', onPress: () => router.push('/agent/listings' as any) }] : []),
    { icon: <Bell size={20} color={Colors.accent} />, label: 'Мэдэгдэл' },
    { icon: <Settings size={20} color={Colors.textSecondary} />, label: 'Тохиргоо' },
    ...(isAdmin ? [{ icon: <LayoutDashboard size={20} color={Colors.textSecondary} />, label: 'Админ хэсэг', onPress: () => router.push('/admin/dashboard' as any) }] : []),
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.firstName?.[0]}{user.lastName?.[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user.lastName}. {user.firstName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            {isAdmin && <View style={styles.badge}><Text style={styles.badgeText}>⚙️ Админ</Text></View>}
            {isAgent && (
              <View style={[styles.badge, user.agentProfile?.approvalStatus === 'approved' ? styles.badgeGreen : styles.badgeGold]}>
                <Text style={styles.badgeText}>
                  {user.agentProfile?.approvalStatus === 'approved' ? '✓ Батлагдсан агент' : '⏳ Хүлээгдэж буй'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {menu.map((item, i) => (
            <Pressable key={i} onPress={item.onPress} style={[styles.menuItem, i === menu.length - 1 && styles.menuItemLast]}>
              <View style={styles.menuIcon}>{item.icon}</View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color={Colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color={Colors.gold} />
          <Text style={styles.logoutText}>Гарах</Text>
        </Pressable>

        <Text style={styles.version}>Darkhanbarilga v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  iconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  notLoggedTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  notLoggedText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  loginBtn: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  loginBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  name: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  badge: { backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  badgeGreen: { backgroundColor: Colors.accentLight },
  badgeGold: { backgroundColor: Colors.goldLight },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  menuSection: { backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: Colors.surface },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.gold },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 24, marginBottom: 32 },
});
