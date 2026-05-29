import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Linking, Platform, NativeModules } from 'react-native';
import { Audio } from 'expo-av';
import { AIService, AIResult } from './src/services/AIService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

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
        const aiResult = await AIService.transcribeAndFormat(uri);
        setResult(aiResult);
      }
    } catch (err) {
      Alert.alert('Processing Error', 'Could not convert voice. Check your API credits.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

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
        <>
          <Text style={styles.title}>Voice2WA Mobile</Text>
          <Text style={styles.subtitle}>Testing the Keyboard AI Engine</Text>

          <View style={styles.micContainer}>
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              activeOpacity={0.7}
              style={[
                styles.micButton,
                recording ? styles.micActive : styles.micInactive
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Text style={styles.micText}>{recording ? 'Recording...' : 'Hold to Speak'}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.hint}>Hinglish supported. Whisper AI tuned.</Text>
          </View>

          <ScrollView style={styles.resultContainer}>
            {result && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>FORMATTED MESSAGE</Text>
                <Text style={styles.formattedText}>{result.formattedMessage}</Text>
                
                {result.poll && (
                  <View style={styles.pollCard}>
                    <Text style={styles.cardLabel}>SUGGESTED POLL</Text>
                    <Text style={styles.pollQuestion}>{result.poll.question}</Text>
                    {result.poll.options.map((opt, i) => (
                      <Text key={i} style={styles.pollOption}>• {opt}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <View style={styles.settingsSection}>
          <Text style={styles.title}>Setup AI Keyboard</Text>
          <Text style={styles.subtitle}>Use Voice2WA inside any app</Text>
          
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>1. Enable Keyboard</Text>
            <Text style={styles.stepDesc}>Go to settings and toggle "Voice2WA Keyboard" on.</Text>
            <TouchableOpacity style={styles.stepButton} onPress={openKeyboardSettings}>
              <Text style={styles.stepButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>2. Switch in WhatsApp</Text>
            <Text style={styles.stepDesc}>Open any chat, click the globe/keyboard icon, and select Voice2WA.</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>AI Keyboard Integration v0.1</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 40,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#6C727A',
    marginTop: 4,
    textAlign: 'center',
  },
  micContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  micButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  micActive: {
    backgroundColor: '#FF4B4B',
  },
  micInactive: {
    backgroundColor: '#25D366',
  },
  micText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    marginTop: 20,
    color: '#9CA3AF',
    fontSize: 14,
  },
  resultContainer: {
    flex: 1,
    width: '100%',
    marginTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 10,
  },
  formattedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1F2937',
  },
  pollCard: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pollOption: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  settingsSection: {
    width: '100%',
    alignItems: 'center',
  },
  stepCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 20,
  },
  stepButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  stepButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

