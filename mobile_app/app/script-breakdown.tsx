import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';

export default function ScriptBreakdown() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBreakdown = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/breakdown-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: 'matrix_script.pdf' })
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
        Upload a PDF script to automatically extract casting requirements, props, wardrobe, and estimated budgets via GPT-4o.
      </Text>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleBreakdown}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Analyzing Script...' : 'Simulate PDF Upload'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#fbbf24" style={{ marginTop: 40 }} />}

      {result && (
        <BlurView intensity={30} tint="dark" style={styles.resultCard}>
          <Text style={styles.resultTitle}>{result.script_title}</Text>
          <Text style={styles.budget}>Est. Budget: {result.estimated_budget_range}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{result.total_scenes}</Text>
              <Text style={styles.statLabel}>Scenes</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{result.speaking_roles}</Text>
              <Text style={styles.statLabel}>Roles</Text>
            </View>
          </View>

          <Text style={styles.subhead}>Extracted Elements:</Text>
          {result.elements.map((el: any, i: number) => (
            <View key={i} style={styles.elementRow}>
              <View>
                <Text style={styles.elCat}>{el.category}</Text>
                <Text style={styles.elItem}>{el.item}</Text>
              </View>
              <Text style={styles.elCost}>{el.cost_est}</Text>
            </View>
          ))}
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
    backgroundColor: '#d97706',
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
    borderColor: 'rgba(245, 158, 11, 0.3)',
    overflow: 'hidden',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  budget: {
    color: '#10b981',
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  stat: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  subhead: {
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 10,
  },
  elementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  elCat: {
    color: '#fbbf24',
    fontSize: 12,
  },
  elItem: {
    color: '#f8fafc',
    fontSize: 16,
  },
  elCost: {
    color: '#94a3b8',
    fontWeight: 'bold',
  }
});
