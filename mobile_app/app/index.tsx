import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function Dashboard() {
  const router = useRouter();

  const modules = [
    { id: 'ip-discovery', title: 'IP Discovery', icon: '💡', desc: 'Scan historical databases for remake gems.', color: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee' },
    { id: 'acting-coach', title: 'Acting Coach', icon: '🎬', desc: 'Extract dialogue and analyze emotion.', color: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
    { id: 'auto-dubbing', title: 'Auto-Dubbing', icon: '🎙️', desc: 'Translate and clone voices instantly.', color: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
    { id: 'script-breakdown', title: 'Script Breakdown', icon: '📄', desc: 'Extract props and estimate budgets.', color: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back, Director.</Text>
        <Text style={styles.subtitle}>All agentic modules are online and standing by.</Text>
      </View>

      <View style={styles.grid}>
        {modules.map((mod) => (
          <TouchableOpacity 
            key={mod.id} 
            activeOpacity={0.8}
            onPress={() => router.push(`/${mod.id}` as any)}
          >
            <BlurView intensity={20} tint="dark" style={[styles.card, { borderColor: mod.color }]}>
              <View style={[styles.iconContainer, { backgroundColor: mod.color }]}>
                <Text style={styles.icon}>{mod.icon}</Text>
              </View>
              <Text style={styles.cardTitle}>{mod.title}</Text>
              <Text style={styles.cardDesc}>{mod.desc}</Text>
              <Text style={[styles.launchText, { color: mod.text }]}>Launch Module →</Text>
            </BlurView>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // slate-950
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8', // slate-400
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800 with opacity
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9', // slate-100
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  launchText: {
    fontSize: 14,
    fontWeight: '500',
  }
});
