import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

export default function ActingCoach() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analyze-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_path: 'simulated_actor_take_1.wav' })
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
    <View style={styles.container}>
      <Text style={styles.info}>
        On a mobile device, this module would normally use the native microphone to record an actor's line reading. For this MVP, we will simulate analyzing a pre-recorded file.
      </Text>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSimulate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Analyzing Takes...' : 'Simulate Audio Upload'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#c084fc" style={{ marginTop: 40 }} />}

      {result && (
        <BlurView intensity={30} tint="dark" style={styles.resultCard}>
          <Text style={styles.resultTitle}>Performance Analysis</Text>
          <Text style={styles.score}>Overall Score: {result.overall_score}/100</Text>
          <Text style={styles.subhead}>Detected Emotion:</Text>
          <Text style={styles.text}>{result.detected_emotion}</Text>
          <Text style={styles.subhead}>Feedback:</Text>
          <Text style={styles.text}>{result.feedback}</Text>
          
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Pitch</Text>
              <Text style={styles.metricValue}>{result.metrics.pitch_variance}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Tempo</Text>
              <Text style={styles.metricValue}>{result.metrics.tempo}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Clarity</Text>
              <Text style={styles.metricValue}>{result.metrics.clarity_score}/100</Text>
            </View>
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#020617',
  },
  info: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#9333ea',
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
    borderColor: 'rgba(168, 85, 247, 0.3)',
    overflow: 'hidden',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#c084fc',
    marginBottom: 4,
  },
  score: {
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: 18,
  },
  subhead: {
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 8,
  },
  text: {
    color: '#f8fafc',
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  metricValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
