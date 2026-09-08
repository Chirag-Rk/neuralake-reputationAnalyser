import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
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

  const handleAnalyze = () => {
    if (!canAnalyze) return;

    router.push({
      pathname: '/analysing',
      params: {
        businessName: businessName.trim(),
        location: location.trim(),
      },
    });
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
          {/* ===================================================== */}
          {/* SCROLLING BACKGROUND                                   */}
          {/* ===================================================== */}

          <View
            pointerEvents="none"
            style={styles.backgroundContainer}
          >
            <Image
              source={require('../../assets/images/reputation-bg.png')}
              style={styles.backgroundImage}
              resizeMode="contain"
            />
          </View>

          {/* ===================================================== */}
          {/* HEADER                                                 */}
          {/* ===================================================== */}

          <View style={styles.header}>
            <View>
              <Text style={styles.logo}>NeuraLake</Text>

              <Text style={styles.eyebrow}>
                REPUTATION INTELLIGENCE
              </Text>
            </View>

            <View style={styles.headerStatus}>
              <View style={styles.headerStatusDot} />
            </View>
          </View>

          {/* ===================================================== */}
          {/* HERO                                                   */}
          {/* ===================================================== */}

          <View style={styles.hero}>
            <View style={styles.heroAccent}>
              <View style={styles.heroAccentDot} />

              <Text style={styles.heroAccentText}>
                INSIGHTS
              </Text>
            </View>

            <Text style={styles.title}>
              Understand what customers really think.
            </Text>

            <Text style={styles.subtitle}>
              Analyze reviews, identify recurring themes, compare
              competitors, and discover what your business should improve.
            </Text>
          </View>

          {/* ===================================================== */}
          {/* SEARCH FORM                                            */}
          {/* ===================================================== */}

          <View style={styles.form}>
            {/* Business name */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Business name
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  businessName.length > 0 &&
                    styles.inputWrapperActive,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Text style={styles.buildingIcon}>
                    ▦
                  </Text>
                </View>

                <TextInput
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="e.g. The Leela Palace"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                  returnKeyType="next"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Location
              </Text>

              <View
                style={[
                  styles.inputWrapper,
                  location.length > 0 &&
                    styles.inputWrapperActive,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Text style={styles.locationIcon}>
                    ⌖
                  </Text>
                </View>

                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Bengaluru, India"
                  placeholderTextColor="#98A2B3"
                  style={styles.input}
                  returnKeyType="done"
                  autoCapitalize="words"
                  autoCorrect={false}
                  onSubmitEditing={handleAnalyze}
                />
              </View>
            </View>
          </View>

          {/* ===================================================== */}
          {/* ANALYZE BUTTON                                         */}
          {/* ===================================================== */}

          <Pressable
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            style={({ pressed }) => [
              styles.button,
              !canAnalyze && styles.buttonDisabled,
              pressed &&
                canAnalyze &&
                styles.buttonPressed,
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                !canAnalyze &&
                  styles.buttonTextDisabled,
              ]}
            >
              Analyze reputation
            </Text>

            {canAnalyze && (
              <Text style={styles.buttonArrow}>
                →
              </Text>
            )}
          </Pressable>

          {/* ===================================================== */}
          {/* WHAT YOU'LL GET                                        */}
          {/* ===================================================== */}

          <View style={styles.infoBox}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoTitle}>
                What you'll get
              </Text>

              <Text style={styles.infoSubtitle}>
                A clear view of your online reputation.
              </Text>
            </View>

            {/* Feature 1 */}
            <View style={styles.infoRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>
                  ▥
                </Text>
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoText}>
                  Rating and review trends
                </Text>

                <Text style={styles.infoDescription}>
                  Understand the signals behind your ratings.
                </Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={styles.infoRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>
                  ✦
                </Text>
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoText}>
                  Customer themes and weaknesses
                </Text>

                <Text style={styles.infoDescription}>
                  See what customers repeatedly mention.
                </Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.infoRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>
                  ⇄
                </Text>
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoText}>
                  Competitor comparison
                </Text>

                <Text style={styles.infoDescription}>
                  Benchmark your reputation against nearby businesses.
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.infoFooter}>
              <View style={styles.footerDot} />

              <Text style={styles.footerText}>
                Powered by Google Places + Gemini
              </Text>
            </View>
          </View>

          {/* ===================================================== */}
          {/* BOTTOM NOTE                                            */}
          {/* ===================================================== */}

          <View style={styles.bottomNote}>
            <Text style={styles.bottomNoteText}>
              Review insights are based on the available source data.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ============================================================= */
  /* ROOT                                                          */
  /* ============================================================= */

  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  container: {
    flex: 1,
    zIndex: 2,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 42,
    position: 'relative',
  },

  /* ============================================================= */
  /* BACKGROUND                                                    */
  /* ============================================================= */

  /*
   * The background is deliberately inside the ScrollView.
   * This makes the illustration move together with the page.
   */

    backgroundContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    
    height: 1050,
    zIndex: 0,
    overflow: 'hidden',
    },

    backgroundImage: {
    position: 'absolute',
    width: 800,
    height: 800,
    top: -85,
    right: -180,
    opacity: 0.18,
    },

  /* ============================================================= */
  /* HEADER                                                        */
  /* ============================================================= */

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 56,
    zIndex: 2,
  },

  logo: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.8,
  },

  eyebrow: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 2.1,
    color: '#667085',
  },

  headerStatus: {
    width: 12,
    height: 12,
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },

  /* ============================================================= */
  /* HERO                                                          */
  /* ============================================================= */

  hero: {
    marginBottom: 38,
    zIndex: 2,
  },

  heroAccent: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 246, 255, 0.92)',
  },

  heroAccentDot: {
    width: 6,
    height: 6,
    marginRight: 7,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },

  heroAccentText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#2563EB',
  },

  title: {
    maxWidth: 700,
    fontSize: 39,
    lineHeight: 45,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -1.6,
  },

  subtitle: {
    marginTop: 18,
    maxWidth: 680,
    fontSize: 17,
    lineHeight: 27,
    fontWeight: '400',
    color: '#667085',
    letterSpacing: -0.15,
  },

  /* ============================================================= */
  /* FORM                                                          */
  /* ============================================================= */

  form: {
    gap: 20,
    zIndex: 2,
  },

  field: {
    gap: 9,
  },

  label: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#344054',
  },

  inputWrapper: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
  },

  inputWrapperActive: {
    borderColor: '#93B4F8',
    backgroundColor: '#FFFFFF',

    shadowColor: '#2563EB',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
  },

  inputIcon: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buildingIcon: {
    fontSize: 26,
    lineHeight: 28,
    color: '#667085',
  },

  locationIcon: {
    fontSize: 30,
    lineHeight: 30,
    color: '#667085',
  },

  input: {
    flex: 1,
    height: '100%',
    paddingRight: 17,
    paddingLeft: 0,
    fontSize: 17,
    color: '#101828',
  },

  /* ============================================================= */
  /* BUTTON                                                        */
  /* ============================================================= */

  button: {
    minHeight: 62,
    marginTop: 27,
    paddingHorizontal: 24,
    borderRadius: 18,
    backgroundColor: '#2563EB',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#2563EB',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,

    zIndex: 2,
  },

  buttonDisabled: {
    backgroundColor: '#D0D5DD',
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonPressed: {
    opacity: 0.86,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  buttonText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  buttonTextDisabled: {
    color: '#667085',
  },

  buttonArrow: {
    marginLeft: 12,
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '400',
    color: '#FFFFFF',
  },

  /* ============================================================= */
  /* WHAT YOU'LL GET                                               */
  /* ============================================================= */

  infoBox: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingTop: 21,
    paddingBottom: 17,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: '#E4E7EC',

    shadowColor: '#101828',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 2,

    zIndex: 2,
  },

  infoHeader: {
    marginBottom: 17,
  },

  infoTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: '#344054',
    letterSpacing: -0.4,
  },

  infoSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    color: '#98A2B3',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },

  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureIconText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2563EB',
  },

  infoCopy: {
    flex: 1,
    marginLeft: 13,
    paddingTop: 1,
  },

  infoText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: '#475467',
  },

  infoDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: '#98A2B3',
  },

  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },

  footerDot: {
    width: 7,
    height: 7,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },

  footerText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: '#98A2B3',
  },

  /* ============================================================= */
  /* BOTTOM NOTE                                                   */
  /* ============================================================= */

  bottomNote: {
    alignItems: 'center',
    marginTop: 18,
    zIndex: 2,
  },

  bottomNoteText: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    color: '#98A2B3',
  },
});