import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Building2, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, signup, isLoading } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<'user' | 'agent'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleSubmit = async () => {
    try {
      if (mode === 'login') {
        if (!email || !password) return Alert.alert('Алдаа', 'Имэйл болон нууц үгээ оруулна уу');
        await login(email.trim().toLowerCase(), password);
      } else {
        if (!firstName || !lastName || !email || !password || !passwordConfirm)
          return Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү');
        if (password.length < 8) return Alert.alert('Алдаа', 'Нууц үг хамгийн багадаа 8 тэмдэгт байх ёстой');
        if (password !== passwordConfirm) return Alert.alert('Алдаа', 'Нууц үг таарахгүй байна');
        await signup({ firstName, lastName, email: email.trim().toLowerCase(), password, confirmPassword: passwordConfirm, phone, role });
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Алдаа', err.message || 'Серверт холбогдоход алдаа гарлаа');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}><Building2 size={36} color={Colors.white} /></View>
          <Text style={styles.appName}>Darkhanbarilga.mn</Text>
          <Text style={styles.tagline}>Монголын шилдэг үл хөдлөх хөрөнгийн платформ</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['login', 'signup'] as const).map(m => (
            <Pressable key={m} onPress={() => setMode(m)} style={[styles.tab, mode === m && styles.tabActive]}>
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'signup' && (
            <>
              <View style={styles.roleRow}>
                {(['user', 'agent'] as const).map(r => (
                  <Pressable key={r} onPress={() => setRole(r)} style={[styles.roleBtn, role === r && styles.roleBtnActive]}>
                    <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                      {r === 'user' ? '👤 Хэрэглэгч' : '🏢 Агент'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <User size={16} color={Colors.textMuted} />
                  <TextInput style={styles.input} placeholder="Овог" placeholderTextColor={Colors.textMuted} value={lastName} onChangeText={setLastName} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <User size={16} color={Colors.textMuted} />
                  <TextInput style={styles.input} placeholder="Нэр" placeholderTextColor={Colors.textMuted} value={firstName} onChangeText={setFirstName} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Phone size={16} color={Colors.textMuted} />
                <TextInput style={styles.input} placeholder="Утасны дугаар" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
            </>
          )}
          <View style={styles.inputGroup}>
            <Mail size={16} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="Имэйл хаяг" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputGroup}>
            <Lock size={16} color={Colors.textMuted} />
            <TextInput style={styles.input} placeholder="Нууц үг" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <Pressable onPress={() => setShowPassword(p => !p)}>
              {showPassword ? <EyeOff size={16} color={Colors.textMuted} /> : <Eye size={16} color={Colors.textMuted} />}
            </Pressable>
          </View>
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Lock size={16} color={Colors.textMuted} />
              <TextInput style={styles.input} placeholder="Нууц үг давтах" placeholderTextColor={Colors.textMuted} value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry={!showPassword} />
            </View>
          )}
          <Pressable onPress={handleSubmit} style={[styles.submitBtn, isLoading && { opacity: 0.6 }]} disabled={isLoading}>
            <Text style={styles.submitBtnText}>{isLoading ? 'Түр хүлээнэ үү...' : mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 20, paddingVertical: 24 },
  logoSection: { alignItems: 'center', gap: 10, marginBottom: 18 },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  tagline: { fontSize: 13, color: Colors.textSecondary },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textSecondary, fontWeight: '700' },
  tabTextActive: { color: Colors.white },
  form: { gap: 12 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface },
  roleBtnActive: { backgroundColor: Colors.accentLight },
  roleBtnText: { color: Colors.textSecondary, fontWeight: '700' },
  roleBtnTextActive: { color: Colors.accentDark },
  row: { flexDirection: 'row', gap: 10 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.borderLight },
  input: { flex: 1, color: Colors.textPrimary },
  submitBtn: { marginTop: 8, backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
