import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

export default function AutoDubbing() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDub = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/dub-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_path: 'movie_scene.mp4', target_language: 'Spanish' })
      });
      const data = await res.json();
      setResult(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <Text style={styles.info}>
        Translate an English clip into Spanish while preserving the original actor's voice clone and lip-syncing.
      </Text>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleDub}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Processing Pipeline...' : 'Generate Spanish Dub'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#34d399" style={{ marginTop: 40 }} />}

      {result && (
        <BlurView intensity={30} tint="dark" style={styles.resultCard}>
          <Text style={styles.resultTitle}>Dubbing Complete</Text>
          
          <View style={styles.pipeline}>
            {result.pipeline_logs.map((log: string, index: number) => (
              <View key={index} style={styles.logRow}>
                <Text style={styles.check}>✓</Text>
                <Text style={styles.logText}>{log}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.playButton}>
            <Text style={styles.playText}>▶ Play Generated Video</Text>
          </TouchableOpacity>
        </BlurView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  info: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCard: {
    marginTop: 30,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    overflow: 'hidden',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34d399',
    marginBottom: 16,
  },
  pipeline: {
    marginBottom: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  check: {
    color: '#10b981',
    marginRight: 10,
    fontWeight: 'bold',
  },
  logText: {
    color: '#cbd5e1',
  },
  playButton: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#34d399'
  },
  playText: {
    color: '#34d399',
    fontWeight: 'bold',
  }
});
