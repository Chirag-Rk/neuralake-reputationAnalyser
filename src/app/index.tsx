import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');

  const canAnalyze =
    businessName.trim().length > 0 && location.trim().length > 0;

  const handleAnalyze = async () => {
  if (!canAnalyze) return;

  try {
    const response = await fetch(
      'http://192.168.1.34:3000/analyse',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: businessName.trim(),
          location: location.trim(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Analysis request failed');
    }

    const data = await response.json();

    console.log('Backend analysis:', data);

    router.push({
      pathname: '/analysing',
      params: {
        businessName: businessName.trim(),
        location: location.trim(),
      },
    });
  } catch (error) {
    console.error('Backend connection error:', error);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>NeuraLake</Text>
            <Text style={styles.eyebrow}>REPUTATION INTELLIGENCE</Text>
          </View>

          {/* Main introduction */}
          <View style={styles.hero}>
            <Text style={styles.title}>Understand what customers really think.</Text>

            <Text style={styles.subtitle}>
              Analyze reviews, identify recurring themes, compare competitors,
              and discover what your business should improve.
            </Text>
          </View>

          {/* Search form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Business name</Text>

              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. The Leela Palace"
                placeholderTextColor="#8A8F98"
                style={styles.input}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>

              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Bengaluru, India"
                placeholderTextColor="#8A8F98"
                style={styles.input}
                returnKeyType="done"
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Analyze button */}
          <Pressable
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            style={({ pressed }) => [
              styles.button,
              !canAnalyze && styles.buttonDisabled,
              pressed && canAnalyze && styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                !canAnalyze && styles.buttonTextDisabled,
              ]}
            >
              Analyze reputation
            </Text>
          </Pressable>

          {/* Trust / explanation */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What you'll get</Text>

            <View style={styles.infoRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.infoText}>
                Rating and review trends
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.infoText}>
                Customer themes, strengths and weaknesses
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.infoText}>
                Competitor comparison and recommendations
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  container: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },

  header: {
    marginBottom: 48,
  },

  logo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },

  eyebrow: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#667085',
  },

  hero: {
    marginBottom: 40,
  },

  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },

  subtitle: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#667085',
  },

  form: {
    gap: 22,
  },

  field: {
    gap: 9,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },

  input: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#101828',
  },

  button: {
    height: 56,
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    backgroundColor: '#D0D5DD',
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  buttonTextDisabled: {
    color: '#667085',
  },

  infoBox: {
    marginTop: 32,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  infoTitle: {
    marginBottom: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#344054',
  },

  infoRow: {
    flexDirection: 'row',
    marginTop: 7,
  },

  bullet: {
    width: 20,
    fontSize: 16,
    color: '#2563EB',
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
  },
});