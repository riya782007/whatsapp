import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { AIService, AIResult, Language, Tone } from './src/services/AIService';

const LANGUAGES: { id: Language; label: string; flag: string }[] = [
  { id: 'auto', label: 'Auto', flag: '✨' },
  { id: 'hindi', label: 'हिंदी', flag: '🇮🇳' },
  { id: 'hinglish', label: 'Hinglish', flag: '🔀' },
  { id: 'english', label: 'English', flag: '🇬🇧' },
];

const TONES: { id: Tone; label: string; emoji: string }[] = [
  { id: 'general', label: 'Professional', emoji: '💬' },
  { id: 'office', label: 'Office', emoji: '💼' },
  { id: 'society', label: 'Society Admin', emoji: '🏘️' },
  { id: 'dealer', label: 'Property Dealer', emoji: '🏠' },
  { id: 'shopkeeper', label: 'Shop / Vendor', emoji: '🛒' },
  { id: 'teacher', label: 'Teacher', emoji: '🧑‍🏫' },
  { id: 'sales', label: 'Sales', emoji: '🤝' },
  { id: 'event', label: 'Event', emoji: '🎉' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [language, setLanguage] = useState<Language>('auto');
  const [tone, setTone] = useState<Tone>('general');

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission denied', 'We need mic access to record your voice.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setRecording(null);
    setIsProcessing(true);
    setResult(null);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const aiResult = await AIService.transcribeAndFormat(uri, language, tone);
        setResult(aiResult);
      }
    } catch (err) {
      Alert.alert('Processing Error', 'Could not convert voice. Check your API credits.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  const share = (target: 'whatsapp' | 'telegram' | 'sms', text: string) => {
    const encoded = encodeURIComponent(text);
    const urls: Record<typeof target, string> = {
      whatsapp: `whatsapp://send?text=${encoded}`,
      telegram: `tg://msg?text=${encoded}`,
      sms: `sms:?body=${encoded}`,
    };
    Linking.openURL(urls[target]).catch(() => {
      // fall back to the web share screen if the app isn't installed
      const web =
        target === 'whatsapp'
          ? `https://wa.me/?text=${encoded}`
          : target === 'telegram'
          ? `https://t.me/share/url?url=&text=${encoded}`
          : urls.sms;
      Linking.openURL(web).catch(() => Alert.alert('Could not open app'));
    });
  };

  const openKeyboardSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.INPUT_METHOD_SETTINGS');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('main')}
          style={[styles.tab, activeTab === 'main' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'main' && styles.activeTabText]}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>Keyboard</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'main' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Voice2WA</Text>
          <Text style={styles.subtitle}>Speak your mind. Send like a pro.</Text>

          {/* Language selector */}
          <Text style={styles.sectionLabel}>LANGUAGE</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.id}
                onPress={() => setLanguage(l.id)}
                style={[styles.chip, language === l.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, language === l.id && styles.chipTextActive]}>
                  {l.flag} {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tone selector */}
          <Text style={styles.sectionLabel}>MESSAGE STYLE</Text>
          <View style={styles.chipRow}>
            {TONES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => setTone(t.id)}
                style={[styles.chip, tone === t.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, tone === t.id && styles.chipTextActive]}>
                  {t.emoji} {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.micContainer}>
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.7}
              style={[styles.micButton, recording ? styles.micActive : styles.micInactive]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Text style={styles.micText}>{recording ? 'Recording...' : 'Hold to Speak'}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>Hold, speak, release. AI does the rest.</Text>
          </View>

          {result && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>FORMATTED MESSAGE</Text>
              <Text style={styles.formattedText}>{result.formattedMessage}</Text>

              {/* Share row */}
              <View style={styles.shareRow}>
                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => share('whatsapp', result.formattedMessage)}
                >
                  <Text style={styles.shareBtnText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: '#229ED9' }]}
                  onPress={() => share('telegram', result.formattedMessage)}
                >
                  <Text style={styles.shareBtnText}>Telegram</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: '#4B5563' }]}
                  onPress={() => share('sms', result.formattedMessage)}
                >
                  <Text style={styles.shareBtnText}>SMS</Text>
                </TouchableOpacity>
              </View>

              {result.poll && (
                <View style={styles.pollCard}>
                  <Text style={styles.cardLabel}>SUGGESTED POLL</Text>
                  <Text style={styles.pollQuestion}>{result.poll.question}</Text>
                  {result.poll.options.map((opt, i) => (
                    <Text key={i} style={styles.pollOption}>{`\u2022 ${opt}`}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.settingsSection}>
          <Text style={styles.title}>Setup AI Keyboard</Text>
          <Text style={styles.subtitle}>Use Voice2WA inside any app</Text>

          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>1. Enable Keyboard</Text>
            <Text style={styles.stepDesc}>Go to settings and toggle the Voice2WA Keyboard on.</Text>
            <TouchableOpacity style={styles.stepButton} onPress={openKeyboardSettings}>
              <Text style={styles.stepButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>2. Switch in WhatsApp</Text>
            <Text style={styles.stepDesc}>
              Open any chat, tap the globe/keyboard icon, and select Voice2WA.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Voice2WA Mobile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  scroll: { width: '100%' },
  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 8 },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activeTabText: { color: '#111827' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1C1E' },
  subtitle: { fontSize: 15, color: '#6C727A', marginTop: 4, textAlign: 'center' },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#fff' },
  micContainer: { marginTop: 28, alignItems: 'center' },
  micButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  micActive: { backgroundColor: '#FF4B4B' },
  micInactive: { backgroundColor: '#25D366' },
  micText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  hint: { marginTop: 16, color: '#9CA3AF', fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 24,
    width: '100%',
  },
  cardLabel: { fontSize: 10, fontWeight: 'bold', color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 },
  formattedText: { fontSize: 16, lineHeight: 24, color: '#1F2937' },
  shareRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  shareBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  pollCard: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  pollQuestion: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  pollOption: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  settingsSection: { width: '100%', alignItems: 'center' },
  stepCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  stepDesc: { fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 },
  stepButton: { backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 12, marginTop: 16, alignItems: 'center' },
  stepButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  footer: { paddingVertical: 16 },
  footerText: { color: '#9CA3AF', fontSize: 12 },
});
