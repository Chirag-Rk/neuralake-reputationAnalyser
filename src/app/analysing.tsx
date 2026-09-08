import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAnalysis } from './analysisStore';

const API_URL = 'http://192.168.1.33:3000';

const STEPS = [
  'Found business',
  'Collecting reviews',
  'Extracting themes',
  'Comparing competitors',
  'Drafting replies',
];

export default function AnalysingScreen() {
  const { businessName, location } = useLocalSearchParams<{
    businessName?: string;
    location?: string;
  }>();

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const runAnalysis = async () => {
    if (!businessName || !location) {
      setError('Business name and location are required.');
      return;
    }

    setError(null);
    setIsRetrying(false);
    setCurrentStep(0);

    try {
      // Step 1: business lookup / analysis request starts
      setCurrentStep(0);

      const response = await fetch(`${API_URL}/analyse`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({
    businessName: businessName.trim(),
    location: location.trim(),
  }),
});

console.log('Backend status:', response.status);

const rawText = await response.text();

console.log(
  'Backend response length:',
  rawText.length
);

if (!response.ok) {
  throw new Error(
    `Server returned ${response.status}: ${rawText.slice(0, 300)}`
  );
}

let data;

try {
  data = JSON.parse(rawText);
} catch {
  throw new Error(
    `Backend returned invalid JSON. Response starts with: ${rawText.slice(
      0,
      300
    )}`
  );
}

console.log('Analysis received successfully');

      // Move through the analysis stages after the backend
      // successfully returns the analysis.
      setCurrentStep(1);

      await new Promise((resolve) => setTimeout(resolve, 350));
      setCurrentStep(2);

      await new Promise((resolve) => setTimeout(resolve, 350));
      setCurrentStep(3);

      await new Promise((resolve) => setTimeout(resolve, 350));
      setCurrentStep(4);

      await new Promise((resolve) => setTimeout(resolve, 500));

      setAnalysis(data);

      router.replace({
        pathname: '/results',
        params: {
          businessName: businessName.trim(),
          location: location.trim(),
        },
      });
    } catch (err) {
      console.error('Backend connection error:', err);

      setError(
        'We could not complete the analysis. Please check that the backend is running and try again.'
      );
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [businessName, location]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View>
            <Text style={styles.eyebrow}>REPUTATION INTELLIGENCE</Text>

            <Text style={styles.title}>Analysis failed</Text>

            <Text style={styles.businessName}>
              {businessName ?? 'Unknown business'}
            </Text>

            <Text style={styles.location}>
              {location ?? 'Unknown location'}
            </Text>
          </View>

          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Something went wrong</Text>

            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              onPress={() => {
                setIsRetrying(true);
                runAnalysis();
              }}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              {isRetrying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.retryButtonText}>Try again</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View>
          <Text style={styles.eyebrow}>REPUTATION INTELLIGENCE</Text>

          <Text style={styles.title}>Analysing</Text>

          <Text style={styles.businessName}>
            {businessName ?? 'Demo Business'}
          </Text>

          <Text style={styles.location}>
            {location ?? 'Bengaluru, India'}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Step {currentStep + 1} of {STEPS.length}
            </Text>

            <Text style={styles.progressPercent}>
              {Math.round(progress)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => {
            const completed = index < currentStep;
            const active = index === currentStep;

            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIndicator,
                    completed && styles.completedIndicator,
                    active && styles.activeIndicator,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepIndicatorText,
                      completed && styles.completedText,
                      active && styles.activeText,
                    ]}
                  >
                    {completed ? '✓' : index + 1}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.stepText,
                    completed && styles.completedStepText,
                    active && styles.activeStepText,
                  ]}
                >
                  {step}
                  {active && ' …'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Status */}
        <View style={styles.note}>
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color="#2563EB" />

            <Text style={styles.noteText}>
              Gathering and analysing reputation data…
            </Text>
          </View>
        </View>
      </View>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#667085',
  },

  title: {
    marginTop: 18,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '700',
    color: '#111827',
  },

  businessName: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '600',
    color: '#344054',
  },

  location: {
    marginTop: 5,
    fontSize: 15,
    color: '#667085',
  },

  progressSection: {
    marginTop: 48,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },

  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E4E7EC',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  stepsContainer: {
    marginTop: 36,
    gap: 20,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  stepIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4E7EC',
  },

  completedIndicator: {
    backgroundColor: '#2563EB',
  },

  activeIndicator: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#2563EB',
  },

  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#667085',
  },

  completedText: {
    color: '#FFFFFF',
  },

  activeText: {
    color: '#2563EB',
  },

  stepText: {
    marginLeft: 14,
    fontSize: 16,
    color: '#98A2B3',
  },

  completedStepText: {
    color: '#344054',
    fontWeight: '600',
  },

  activeStepText: {
    color: '#111827',
    fontWeight: '700',
  },

  note: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },

  errorBox: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  errorText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#667085',
  },

  retryButton: {
    height: 52,
    marginTop: 20,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  backButton: {
    height: 52,
    marginTop: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#344054',
  },

  buttonPressed: {
    opacity: 0.8,
  },
});