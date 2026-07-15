import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { Sparkles, Clapperboard, Mic2, FileText } from 'lucide-react-native';

export default function Dashboard() {
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<string>('free');

  useEffect(() => {
    const getPlan = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/billing/subscription');
        const resJson = await res.json();
        if (resJson.status === 'success') {
          setActivePlan(resJson.data.tier);
        }
      } catch (e) {
        // fallback
      }
    };
    getPlan();
  }, []);

  const handleModulePress = (modId: string) => {
    if (activePlan === 'free' && modId === 'acting-coach') {
      alert("Upgrade Required: Upgrade to the Pro Studio plan to access AI Acting Coach on mobile.");
      return;
    }
    router.push(`/${modId}` as any);
  };

  const modules = [
    { id: 'ip-discovery', title: 'IP Discovery', icon: Sparkles, desc: 'Scan historical databases for remake gems.', color: 'rgba(6, 182, 212, 0.2)', text: '#22d3ee' },
    { id: 'acting-coach', title: 'Acting Coach', icon: Clapperboard, desc: 'Extract dialogue and analyze emotion.', color: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
    { id: 'auto-dubbing', title: 'Auto-Dubbing', icon: Mic2, desc: 'Translate and clone voices instantly.', color: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
    { id: 'script-breakdown', title: 'Script Breakdown', icon: FileText, desc: 'Extract props and estimate budgets.', color: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.header}
      >
        <Text style={styles.title}>Welcome back, Director.</Text>
        <View style={styles.planBadgeContainer}>
          <Text style={styles.subtitle}>All agentic modules are online.</Text>
          <View style={[styles.planBadge, { backgroundColor: activePlan === 'free' ? '#475569' : activePlan === 'pro' ? '#7c3aed' : '#0284c7' }]}>
            <Text style={styles.planBadgeText}>{activePlan.toUpperCase()} TIER</Text>
          </View>
        </View>
      </MotiView>

      <View style={styles.grid}>
        {modules.map((mod, index) => {
          const IconComponent = mod.icon as any;
          return (
            <MotiView 
              key={mod.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: index * 100, damping: 20, stiffness: 200 }}
            >
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => handleModulePress(mod.id)}
              >
                <BlurView intensity={20} tint="dark" style={[styles.card, { borderColor: mod.color }]}>
                  <View style={[styles.iconContainer, { backgroundColor: mod.color }]}>
                    <IconComponent color={mod.text} size={24} />
                  </View>
                  <Text style={styles.cardTitle}>{mod.title}</Text>
                  <Text style={styles.cardDesc}>{mod.desc}</Text>
                  <Text style={[styles.launchText, { color: mod.text }]}>Launch Module →</Text>
                </BlurView>
              </TouchableOpacity>
            </MotiView>
          );
        })}
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
  },
  planBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  }
});
