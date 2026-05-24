import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

export default function IPDiscovery() {
  const [genre, setGenre] = useState('');
  const [era, setEra] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDiscover = async () => {
    if (!genre || !era) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/discover-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, era })
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
      <Text style={styles.label}>Target Genre</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g., Sci-Fi Thriller" 
        placeholderTextColor="#64748b"
        value={genre}
        onChangeText={setGenre}
      />

      <Text style={styles.label}>Target Era</Text>
      <TextInput 
        style={styles.input} 
        placeholder="e.g., 1980s" 
        placeholderTextColor="#64748b"
        value={era}
        onChangeText={setEra}
      />

      <TouchableOpacity 
        style={[styles.button, (!genre || !era || loading) && styles.buttonDisabled]} 
        onPress={handleDiscover}
        disabled={!genre || !era || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Scanning...' : 'Discover IP'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#22d3ee" style={{ marginTop: 40 }} />}

      {result && (
        <BlurView intensity={30} tint="dark" style={styles.resultCard}>
          <Text style={styles.resultTitle}>{result.original_title} ({result.year})</Text>
          <Text style={styles.matchScore}>Match Score: {result.match_score}%</Text>
          <Text style={styles.subhead}>Logline:</Text>
          <Text style={styles.text}>{result.logline}</Text>
          <Text style={styles.subhead}>Modern Twist:</Text>
          <Text style={styles.text}>{result.modern_twist}</Text>
          <Text style={styles.subhead}>Why Now:</Text>
          <Text style={styles.text}>{result.why_now}</Text>
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
  label: {
    color: '#cbd5e1',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
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
    borderColor: 'rgba(6, 182, 212, 0.3)',
    overflow: 'hidden',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22d3ee',
  },
  matchScore: {
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subhead: {
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 8,
  },
  text: {
    color: '#f8fafc',
    marginBottom: 8,
  }
});
