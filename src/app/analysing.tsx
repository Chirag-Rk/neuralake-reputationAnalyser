import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((step) => {
        if (step < STEPS.length - 1) {
          return step + 1;
        }

        clearInterval(interval);

        setTimeout(() => {
          router.replace({
            pathname: '/results',
            params: {
              businessName: businessName ?? 'Demo Business',
              location: location ?? 'Bengaluru, India',
            },
          });
        }, 800);

        return step;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [businessName, location]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
                { width: `${progress}%` },
              ]}
            />
          </View>
        </View>

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

        <View style={styles.note}>
          <Text style={styles.noteText}>
            This demo is using sample analysis data. Real review
            collection and analysis will be connected in the backend.
          </Text>
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

  noteText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },
});