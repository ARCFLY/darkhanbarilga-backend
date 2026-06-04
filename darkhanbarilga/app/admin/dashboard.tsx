import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';
import { ChevronLeft, Users, Building2, Calendar, CheckCircle2, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { adminAPI } from '@/services/api';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers({ role: 'agent' }),
        ]);
        setStats(statsRes.data.stats);
        const pending = usersRes.data.users.filter(
          (u: any) => u.agentProfile?.approvalStatus === 'pending'
        );
        setPendingAgents(pending);
        setUsers(usersRes.data.users);
      } catch (e) {
        console.log('Admin load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminAPI.approveAgent(id);
      setPendingAgents(prev => prev.filter(a => a._id !== id));
    } catch (e: any) {
      console.log('Approve error:', e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminAPI.rejectAgent(id);
      setPendingAgents(prev => prev.filter(a => a._id !== id));
    } catch (e: any) {
      console.log('Reject error:', e);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Админ хяналтын самбар</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Stats */}
          {stats && (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.accentLight }]}>
                  <Users size={22} color={Colors.accent} />
                </View>
                <Text style={styles.statNumber}>{stats.users?.total || 0}</Text>
                <Text style={styles.statLabel}>Хэрэглэгч</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                  <Users size={22} color="#6366F1" />
                </View>
                <Text style={styles.statNumber}>{stats.agents?.total || 0}</Text>
                <Text style={styles.statLabel}>Агент</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.accentLight }]}>
                  <Building2 size={22} color={Colors.accent} />
                </View>
                <Text style={styles.statNumber}>{stats.properties?.total || 0}</Text>
                <Text style={styles.statLabel}>Зар</Text>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: Colors.goldLight }]}>
                  <Calendar size={22} color={Colors.gold} />
                </View>
                <Text style={styles.statNumber}>{stats.appointments?.pending || 0}</Text>
                <Text style={styles.statLabel}>Захиалга</Text>
              </View>
            </View>
          )}

          {/* Pending agents */}
          <Text style={styles.sectionTitle}>
            Хүлээгдэж буй агентууд ({pendingAgents.length})
          </Text>

          {pendingAgents.length === 0 ? (
            <View style={styles.emptyCard}>
              <CheckCircle2 size={32} color={Colors.accent} />
              <Text style={styles.emptyText}>Хүлээгдэж буй агент байхгүй</Text>
            </View>
          ) : (
            pendingAgents.map(agent => (
              <View key={agent._id} style={styles.agentCard}>
                <View style={styles.agentAvatar}>
                  <Text style={styles.agentAvatarText}>
                    {agent.firstName?.[0]}{agent.lastName?.[0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.agentName}>{agent.lastName}. {agent.firstName}</Text>
                  <Text style={styles.agentEmail}>{agent.email}</Text>
                  {agent.agentProfile?.licenseNumber && (
                    <Text style={styles.agentLicense}>{agent.agentProfile.licenseNumber}</Text>
                  )}
                  <View style={styles.pendingBadge}>
                    <Clock size={12} color={Colors.gold} />
                    <Text style={styles.pendingBadgeText}>Хүлээгдэж буй</Text>
                  </View>
                </View>
                <View style={styles.agentActions}>
                  <Pressable onPress={() => handleApprove(agent._id)} style={styles.approveBtn}>
                    <Text style={styles.approveBtnText}>Батлах</Text>
                  </Pressable>
                  <Pressable onPress={() => handleReject(agent._id)} style={styles.rejectBtn}>
                    <Text style={styles.rejectBtnText}>Татгалзах</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {/* All agents */}
          <Text style={styles.sectionTitle}>Бүх агентууд ({users.length})</Text>
          {users.map(u => (
            <View key={u._id} style={styles.userRow}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentAvatarText}>{u.firstName?.[0]}{u.lastName?.[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{u.lastName}. {u.firstName}</Text>
                <Text style={styles.agentEmail}>{u.email}</Text>
              </View>
              <View style={[
                styles.statusPill,
                u.agentProfile?.approvalStatus === 'approved' ? styles.pillGreen :
                u.agentProfile?.approvalStatus === 'pending' ? styles.pillGold : styles.pillRed,
              ]}>
                <Text style={styles.pillText}>
                  {u.agentProfile?.approvalStatus === 'approved' ? 'Батлагдсан' :
                   u.agentProfile?.approvalStatus === 'pending' ? 'Хүлээгдэж буй' : 'Татгалзсан'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: Colors.surface },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', gap: 8 },
  statIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  agentCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  agentAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.accent },
  agentName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  agentEmail: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  agentLicense: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: Colors.goldLight, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pendingBadgeText: { fontSize: 11, color: Colors.gold, fontWeight: '600' },
  agentActions: { gap: 8 },
  approveBtn: { backgroundColor: Colors.accentLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.accent },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  rejectBtn: { backgroundColor: Colors.redLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.red },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: Colors.red },
  userRow: { backgroundColor: Colors.white, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  pillGreen: { backgroundColor: Colors.accentLight },
  pillGold: { backgroundColor: Colors.goldLight },
  pillRed: { backgroundColor: Colors.redLight },
  pillText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
});
