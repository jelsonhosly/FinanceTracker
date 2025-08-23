import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from '@/utils/storage';

export default function DebugScreen() {
  const [storageContents, setStorageContents] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const storage: Record<string, any> = {};
        
        for (const key of keys) {
          try {
            const value = await AsyncStorage.getItem(key);
            storage[key] = value ? JSON.parse(value) : null;
          } catch (e) {
            storage[key] = `Error parsing: ${e instanceof Error ? e.message : String(e)}`;
          }
        }
        
        setStorageContents(storage);
      } catch (e) {
        console.error('DebugScreen - Error loading storage:', e);
      } finally {
        setLoading(false);
      }
    };

    loadStorage();
  }, []);

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      setStorageContents({});
      alert('Storage cleared! The app will restart.');
      // Force app restart by navigating to onboarding
      router.replace('/onboarding');
    } catch (e) {
      console.error('DebugScreen - Error clearing storage:', e);
      alert('Error clearing storage');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading debug information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Debug Information</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearStorage}>
        <Text style={styles.buttonText}>Clear Storage</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>AsyncStorage Contents:</Text>
      <View style={styles.storageContainer}>
        {Object.entries(storageContents).map(([key, value]) => (
          <View key={key} style={styles.storageItem}>
            <Text style={styles.storageKey}>{key}:</Text>
            <Text style={styles.storageValue}>
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </Text>
          </View>
        ))}
        
        {Object.keys(storageContents).length === 0 && (
          <Text>No data in AsyncStorage</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storageContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  storageItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  storageKey: {
    fontWeight: '600',
    marginBottom: 4,
  },
  storageValue: {
    fontFamily: 'Courier',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
});
