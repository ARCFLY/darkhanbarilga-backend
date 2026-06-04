import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";

export default function AgentProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Профайл тохиргоо</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
            </Text>
          </View>
          <Text style={styles.avatarLabel}>Профайл зураг</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Агентын мэдээлэл</Text>
          <InfoRow label="Овог" value={user?.lastName || ""} />
          <InfoRow label="Нэр" value={user?.firstName || ""} />
          <InfoRow label="Цахим шуудан" value={user?.email || ""} />
          <InfoRow label="Утасны дугаар" value={user?.phone || "Байхгүй"} />
          <InfoRow
            label="Лиценз"
            value={user?.agentProfile?.licenseNumber || "Оруулаагүй"}
          />
          <InfoRow label="Агент" value={user?.agentProfile?.agency || "Оруулаагүй"} />
          <InfoRow
            label="Төлөв"
            value={
              user?.agentProfile?.approvalStatus === "approved"
                ? "Батлагдсан"
                : "Хүлээгдэж буй"
            }
          />
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Энэ хуудас нь Rork фронтэнд дээрх загварыг үргэлжлүүлэн харуулж
            байна. Хэрэв backend руу шинэчлэлт хийх бол `PATCH
            /api/auth/update-profile` эндээс дуудагдах боломжтой.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.labelBox}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  avatarSection: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.accent,
  },
  avatarLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  labelBox: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "right",
  },
  noteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.borderLight,
    padding: 14,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
