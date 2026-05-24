import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0f172a', // slate-900
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '300',
          },
          contentStyle: {
            backgroundColor: '#020617', // slate-950
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Studio OS Dashboard',
            headerShown: false
          }} 
        />
        <Stack.Screen 
          name="ip-discovery" 
          options={{ title: 'IP Discovery' }} 
        />
        <Stack.Screen 
          name="acting-coach" 
          options={{ title: 'Acting Coach' }} 
        />
        <Stack.Screen 
          name="auto-dubbing" 
          options={{ title: 'Auto-Dubbing' }} 
        />
        <Stack.Screen 
          name="script-breakdown" 
          options={{ title: 'Script Breakdown' }} 
        />
      </Stack>
    </>
  );
}
