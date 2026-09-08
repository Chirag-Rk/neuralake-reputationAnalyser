require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// =========================================================
// ENVIRONMENT VARIABLES
// =========================================================

const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY;

const GOOGLE_PLACES_LEGACY_API_KEY =
  process.env.GOOGLE_PLACES_LEGACY_API_KEY;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  'gemini-3.6-flash';

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());

// =========================================================
// FETCH WITH TIMEOUT
// =========================================================

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 15000
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

// =========================================================
// HEALTH CHECK
// =========================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NeuraLake Reputation API',
  });
});

// =========================================================
// NORMALIZE GOOGLE REVIEWS
// =========================================================

function normalizeReviews(reviews) {
  return (reviews ?? [])
    .map((review) => {
      const timestamp =
        Number(review.time);

      const rating =
        Number(review.rating);

      const text =
        typeof review.text === 'string'
          ? review.text.trim()
          : '';

      const author =
        typeof review.author_name === 'string' &&
        review.author_name.trim()
          ? review.author_name.trim()
          : 'Anonymous';

      const authorUrl =
        typeof review.author_url === 'string'
          ? review.author_url.trim()
          : '';

      const validTimestamp =
        Number.isFinite(timestamp) &&
        timestamp > 0;

      const date =
        validTimestamp
          ? new Date(
              timestamp * 1000
            ).toISOString()
          : null;

      /*
       * Google Places review objects do not provide a dedicated
       * review ID in the Legacy Place Details response.
       * Build a deterministic fallback from the reviewer, timestamp,
       * and review text instead of using the array index.
       */
      const stableReviewKey =
        [
          authorUrl || author,
          validTimestamp ? timestamp : '',
          text,
          Number.isFinite(rating) ? rating : '',
        ].join('|');

      return {
        id:
          `google-${Buffer.from(
            stableReviewKey
          ).toString('base64url')}`,

        author,

        rating:
          Number.isFinite(rating) &&
          rating >= 1 &&
          rating <= 5
            ? rating
            : null,

        text,

        date,

        source: 'Google',
      };
    })
    .filter(
      (review) =>
        review.rating !== null
    );
}

// =========================================================
// DEDUPLICATE REVIEWS
// =========================================================

function deduplicateReviews(reviews) {
  const uniqueReviews =
    new Map();

  for (const review of reviews ?? []) {
    if (!review?.id) {
      continue;
    }

    if (!uniqueReviews.has(review.id)) {
      uniqueReviews.set(
        review.id,
        review
      );
    }
  }

  return Array.from(
    uniqueReviews.values()
  );
}

// =========================================================
// BASIC SENTIMENT
// =========================================================

function classifySentiment(rating) {
  if (rating >= 4) {
    return 'positive';
  }

  if (rating === 3) {
    return 'mixed';
  }

  return 'negative';
}

// =========================================================
// REVIEW METRICS
// =========================================================

function calculateReviewMetrics(reviews) {
  const ratingDistribution = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0,
  };

  const sentimentCounts = {
    positive: 0,
    mixed: 0,
    negative: 0,
  };

  for (const review of reviews) {
    const key =
      String(review.rating);

    if (
      Object.prototype.hasOwnProperty.call(
        ratingDistribution,
        key
      )
    ) {
      ratingDistribution[key]++;
    }

    sentimentCounts[
      classifySentiment(review.rating)
    ]++;
  }

  const ratings =
    reviews
      .map(
        (review) =>
          review.rating
      )
      .filter(
        (rating) =>
          typeof rating === 'number'
      );

  const averageRating =
    ratings.length > 0
      ? Number(
          (
            ratings.reduce(
              (sum, rating) =>
                sum + rating,
              0
            ) /
            ratings.length
          ).toFixed(2)
        )
      : null;

  const datedReviews =
    reviews
      .filter(
        (review) =>
          review.date
      )
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

  let firstReviewDate = null;
  let lastReviewDate = null;
  let perMonth = null;
  let monthsCovered = 0;
  let trend =
    'insufficient_data';

  if (
    datedReviews.length > 0
  ) {
    firstReviewDate =
      datedReviews[0].date;

    lastReviewDate =
      datedReviews[
        datedReviews.length - 1
      ].date;

    const firstDate =
      new Date(
        firstReviewDate
      );

    const lastDate =
      new Date(
        lastReviewDate
      );

    const elapsedDays =
      Math.max(
        1,
        (
          lastDate.getTime() -
          firstDate.getTime()
        ) /
          (1000 * 60 * 60 * 24)
      );

    const elapsedMonths =
      elapsedDays / 30.44;

    monthsCovered =
      Number(
        elapsedMonths.toFixed(2)
      );

    // -------------------------------------------------------
    // Honest velocity calculation
    //
    // Do not extrapolate a monthly rate from a tiny sample
    // collected over only a few days.
    //
    // A monthly velocity is considered meaningful only when:
    // - at least 10 dated reviews are available
    // - the sample spans at least 30 days
    // -------------------------------------------------------

    if (
      datedReviews.length >= 10 &&
      elapsedDays >= 30
    ) {
      perMonth =
        Number(
          (
            datedReviews.length /
            elapsedMonths
          ).toFixed(2)
        );
    } else {
      perMonth = null;
    }
  }

  // -------------------------------------------------------
  // Trend calculation
  // Only claim a trend when there are enough reviews.
  // -------------------------------------------------------

  if (
    datedReviews.length >= 20
  ) {
    const midpoint =
      Math.floor(
        datedReviews.length / 2
      );

    const firstHalf =
      datedReviews.slice(
        0,
        midpoint
      );

    const secondHalf =
      datedReviews.slice(
        midpoint
      );

    if (
      firstHalf.length > 0 &&
      secondHalf.length > 0
    ) {
      const firstStart =
        new Date(
          firstHalf[0].date
        );

      const firstEnd =
        new Date(
          firstHalf[
            firstHalf.length - 1
          ].date
        );

      const secondStart =
        new Date(
          secondHalf[0].date
        );

      const secondEnd =
        new Date(
          secondHalf[
            secondHalf.length - 1
          ].date
        );

      const firstMonths =
        Math.max(
          (
            firstEnd.getTime() -
            firstStart.getTime()
          ) /
            (
              1000 *
              60 *
              60 *
              24 *
              30.44
            ),
          1 / 30.44
        );

      const secondMonths =
        Math.max(
          (
            secondEnd.getTime() -
            secondStart.getTime()
          ) /
            (
              1000 *
              60 *
              60 *
              24 *
              30.44
            ),
          1 / 30.44
        );

      const firstVelocity =
        firstHalf.length /
        firstMonths;

      const secondVelocity =
        secondHalf.length /
        secondMonths;

      const difference =
        secondVelocity -
        firstVelocity;

      if (
        Math.abs(difference) < 0.5
      ) {
        trend = 'flat';
      } else if (
        difference > 0
      ) {
        trend = 'rising';
      } else {
        trend = 'falling';
      }
    }
  }

  const reviewsWithText =
    reviews.filter(
      (review) =>
        review.text.length > 0
    );

  return {
    averageRating,

    ratingDistribution,

    sentimentCounts,

    reviewDates: {
      first:
        firstReviewDate,
      last:
        lastReviewDate,
    },

    velocity: {
      perMonth,
      trend,
      monthsCovered,
      sampleBased: true,
    },

    reviewCount:
      reviews.length,

    reviewsWithText:
      reviewsWithText.length,
  };
}

// =========================================================
// BUSINESS TYPES
// =========================================================

const GENERIC_PLACE_TYPES =
  new Set([
    'premise',
    'street_address',
    'route',
    'postal_address',
    'plus_code',
    'establishment',
    'point_of_interest',
    'geocode',
  ]);

const PREFERRED_BUSINESS_TYPES =
  new Set([
    'hotel',
    'resort_hotel',
    'bed_and_breakfast',
    'hostel',
    'motel',
    'inn',
    'guest_house',
    'restaurant',
    'cafe',
    'bar',
    'bakery',
    'spa',
    'gym',
    'dentist',
    'doctor',
    'hospital',
    'school',
    'university',
    'shopping_mall',
    'store',
  ]);

// =========================================================
// NORMALIZE BUSINESS NAME
// =========================================================

function normalizeBusinessName(
  value = ''
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

// =========================================================
// GET BUSINESS TYPE
// =========================================================

function getCandidatePrimaryType(
  candidate
) {
  if (
    candidate?.primaryType &&
    PREFERRED_BUSINESS_TYPES.has(
      candidate.primaryType
    )
  ) {
    return candidate.primaryType;
  }

  return (
    candidate?.types?.find(
      (type) =>
        PREFERRED_BUSINESS_TYPES.has(
          type
        )
    ) ??
    candidate?.primaryType ??
    null
  );
}

// =========================================================
// NAME TOKEN SCORE
// =========================================================

function calculateNameTokenScore(
  normalizedBusinessName,
  normalizedCandidateName
) {
  const businessTokens =
    normalizedBusinessName
      .split(' ')
      .filter(
        (token) =>
          token.length >= 3
      );

  const candidateTokens =
    normalizedCandidateName
      .split(' ')
      .filter(
        (token) =>
          token.length >= 3
      );

  if (
    businessTokens.length === 0 ||
    candidateTokens.length === 0
  ) {
    return 0;
  }

  const sharedTokenCount =
    businessTokens.filter(
      (token) =>
        candidateTokens.includes(
          token
        )
    ).length;

  return Math.min(
    sharedTokenCount * 8,
    24
  );
}

// =========================================================
// SELECT BEST BUSINESS
// =========================================================

function selectBestBusinessCandidate(
  places,
  businessName,
  location
) {
  const normalizedBusinessName =
    normalizeBusinessName(
      businessName
    );

  const normalizedLocation =
    normalizeBusinessName(
      location
    );

  const scored =
    places.map(
      (candidate) => {
        const name =
          candidate.displayName
            ?.text ?? '';

        const normalizedCandidateName =
          normalizeBusinessName(
            name
          );

        const primaryType =
          getCandidatePrimaryType(
            candidate
          );

        const address =
          normalizeBusinessName(
            candidate.formattedAddress ??
              ''
          );

        let score = 0;

        // ---------------------------------------------------
        // REAL BUSINESS TYPE
        // ---------------------------------------------------

        if (
          primaryType &&
          PREFERRED_BUSINESS_TYPES.has(
            primaryType
          )
        ) {
          score += 40;
        }

        // ---------------------------------------------------
        // GENERIC PLACE PENALTY
        // ---------------------------------------------------

        const candidateTypes = [
          candidate.primaryType,
          ...(candidate.types ?? []),
        ];

        if (
          candidateTypes.some(
            (type) =>
              GENERIC_PLACE_TYPES.has(
                type
              )
          )
        ) {
          score -= 100;
        }

        // ---------------------------------------------------
        // RATING DATA
        // ---------------------------------------------------

        if (
          typeof candidate.rating ===
          'number'
        ) {
          score += 25;
        }

        // ---------------------------------------------------
        // REVIEW COUNT
        // ---------------------------------------------------

        if (
          typeof candidate.userRatingCount ===
            'number' &&
          candidate.userRatingCount > 0
        ) {
          score += 25;
        }

        // ---------------------------------------------------
        // EXACT NAME
        // ---------------------------------------------------

        if (
          normalizedCandidateName ===
          normalizedBusinessName
        ) {
          score += 30;
        }

        // ---------------------------------------------------
        // CANDIDATE CONTAINS BUSINESS NAME
        // ---------------------------------------------------

        else if (
          normalizedCandidateName.includes(
            normalizedBusinessName
          )
        ) {
          score += 20;
        }

        // ---------------------------------------------------
        // BUSINESS NAME CONTAINS CANDIDATE NAME
        // ---------------------------------------------------

        else if (
          normalizedBusinessName.includes(
            normalizedCandidateName
          )
        ) {
          score += 10;
        }

        // ---------------------------------------------------
        // TOKEN SIMILARITY
        // ---------------------------------------------------

        score +=
          calculateNameTokenScore(
            normalizedBusinessName,
            normalizedCandidateName
          );

        // ---------------------------------------------------
        // LOCATION
        // ---------------------------------------------------

        if (
          normalizedLocation &&
          address.includes(
            normalizedLocation
          )
        ) {
          score += 10;
        }

        return {
          candidate,
          score,
          primaryType,
        };
      }
    );

  scored.sort(
    (a, b) =>
      b.score - a.score
  );

  console.log(
    'BUSINESS CANDIDATES:',
    scored.map(
      (item) => ({
        name:
          item.candidate
            .displayName?.text,

        primaryType:
          item.primaryType,

        rating:
          item.candidate.rating,

        reviewCount:
          item.candidate
            .userRatingCount,

        score:
          item.score,
      })
    )
  );

  const selected =
    scored[0]?.candidate ??
    places[0];

  console.log(
    'SELECTED BUSINESS CANDIDATE:',
    selected?.displayName?.text
  );

  return selected;
}

// =========================================================
// BUSINESS FALLBACK RESOLUTION
// =========================================================

async function resolveBusinessCandidates({
  places,
  businessName,
  location,
}) {
  let candidates =
    Array.isArray(places)
      ? [...places]
      : [];

  if (
    candidates.length === 0
  ) {
    return candidates;
  }

  const firstPlace =
    candidates[0];

  const firstPlaceTypes = [
    firstPlace.primaryType,
    ...(firstPlace.types ?? []),
  ].filter(Boolean);

  const isGenericPlace =
    firstPlaceTypes.some(
      (type) =>
        GENERIC_PLACE_TYPES.has(
          type
        )
    );

  // -------------------------------------------------------
  // If Google already returned a real business,
  // don't make extra requests.
  // -------------------------------------------------------

  if (!isGenericPlace) {
    return candidates;
  }

  if (
    !firstPlace.location ||
    typeof firstPlace.location.latitude !==
      'number' ||
    typeof firstPlace.location.longitude !==
      'number'
  ) {
    console.warn(
      'Generic place detected but location is unavailable.'
    );

    return candidates;
  }

  console.log(
    'GENERIC PLACE DETECTED:',
    firstPlace.displayName?.text
  );

  console.log(
    'GENERIC PLACE LOCATION:',
    firstPlace.location
  );

  const fallbackFieldMask =
    [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.primaryType',
      'places.types',
      'places.rating',
      'places.userRatingCount',
      'places.location',
    ].join(',');

  // =======================================================
  // FALLBACK 1: LOCATION-BIASED TEXT SEARCH
  // =======================================================

  try {
    const fallbackTextResponse =
      await fetchWithTimeout(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'X-Goog-Api-Key':
              GOOGLE_PLACES_API_KEY,

            'X-Goog-FieldMask':
              fallbackFieldMask,
          },

          body: JSON.stringify({
            textQuery:
              businessName,

            maxResultCount:
              10,

            locationBias: {
              circle: {
                center: {
                  latitude:
                    firstPlace.location
                      .latitude,

                  longitude:
                    firstPlace.location
                      .longitude,
                },

                radius:
                  5000,
              },
            },
          }),
        },
        12000
      );

    const fallbackTextData =
      await fallbackTextResponse.json();

    if (
      !fallbackTextResponse.ok
    ) {
      console.warn(
        'Fallback Text Search failed:',
        fallbackTextData.error?.message ??
          'Unknown Google error.'
      );
    } else {
      const fallbackPlaces =
        fallbackTextData.places ??
        [];

      console.log(
        'FALLBACK TEXT SEARCH RESULTS:',
        fallbackPlaces.map(
          (candidate) => ({
            name:
              candidate.displayName
                ?.text,

            primaryType:
              candidate.primaryType,

            types:
              candidate.types,

            rating:
              candidate.rating,

            reviewCount:
              candidate.userRatingCount,
          })
        )
      );

      candidates.push(
        ...fallbackPlaces
      );
    }
  } catch (error) {
    console.warn(
      'Fallback Text Search exception:',
      error.message
    );
  }

  // =======================================================
  // FALLBACK 2: NEARBY SEARCH
  // =======================================================

  try {
    const nearbyResponse =
      await fetchWithTimeout(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'X-Goog-Api-Key':
              GOOGLE_PLACES_API_KEY,

            'X-Goog-FieldMask':
              fallbackFieldMask,
          },

          body: JSON.stringify({
            includedPrimaryTypes:
              Array.from(
                PREFERRED_BUSINESS_TYPES
              ),

            maxResultCount:
              20,

            locationRestriction: {
              circle: {
                center: {
                  latitude:
                    firstPlace.location
                      .latitude,

                  longitude:
                    firstPlace.location
                      .longitude,
                },

                radius:
                  1000,
              },
            },
          }),
        },
        12000
      );

    const nearbyData =
      await nearbyResponse.json();

    if (
      !nearbyResponse.ok
    ) {
      console.warn(
        'Fallback Nearby Search failed:',
        nearbyData.error?.message ??
          'Unknown Google error.'
      );
    } else {
      const nearbyPlaces =
        nearbyData.places ??
        [];

      console.log(
        'FALLBACK NEARBY SEARCH RESULTS:',
        nearbyPlaces.map(
          (candidate) => ({
            name:
              candidate.displayName
                ?.text,

            primaryType:
              candidate.primaryType,

            types:
              candidate.types,

            rating:
              candidate.rating,

            reviewCount:
              candidate.userRatingCount,
          })
        )
      );

      candidates.push(
        ...nearbyPlaces
      );
    }
  } catch (error) {
    console.warn(
      'Fallback Nearby Search exception:',
      error.message
    );
  }

  // =======================================================
  // REMOVE DUPLICATES
  // =======================================================

  const uniquePlaces =
    new Map();

  for (
    const candidate of candidates
  ) {
    if (!candidate?.id) {
      continue;
    }

    uniquePlaces.set(
      candidate.id,
      candidate
    );
  }

  const uniqueCandidates =
    Array.from(
      uniquePlaces.values()
    );

  console.log(
    'TOTAL CANDIDATES AFTER FALLBACK:',
    uniqueCandidates.length
  );

  return uniqueCandidates;
}

// =========================================================
// GEMINI THEME ANALYSIS SCHEMA
// =========================================================

const reviewAnalysisSchema = {
  type: 'object',

  properties: {
    themes: {
      type: 'array',

      items: {
        type: 'object',

        properties: {
          theme: {
            type: 'string',
          },

          mentions: {
            type: 'integer',
          },

          sentiment: {
            type: 'string',

            enum: [
              'positive',
              'mixed',
              'negative',
            ],
          },

          quotes: {
            type: 'array',

            items: {
              type: 'string',
            },
          },

          evidenceStrength: {
            type: 'string',

            enum: [
              'limited',
              'moderate',
              'strong',
            ],
          },
        },

        required: [
          'theme',
          'mentions',
          'sentiment',
          'quotes',
          'evidenceStrength',
        ],
      },
    },

    strengths: {
      type: 'array',

      items: {
        type: 'string',
      },
    },

    weaknesses: {
      type: 'array',

      items: {
        type: 'string',
      },
    },
  },

  required: [
    'themes',
    'strengths',
    'weaknesses',
  ],
};

// =========================================================
// GEMINI THEME ANALYSIS
// =========================================================

async function analyseReviewsWithGemini(
  reviews
) {
  const reviewsWithText =
    reviews.filter(
      (review) =>
        review.text.length > 0
    );

  if (
    reviewsWithText.length === 0
  ) {
    return {
      themes: [],
      strengths: [],
      weaknesses: [],

      analysisNote:
        'No review text was available for semantic analysis.',
    };
  }

  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured.'
    );
  }

  const {
    GoogleGenAI,
  } = await import(
    '@google/genai'
  );

  const ai =
    new GoogleGenAI({
      apiKey:
        GEMINI_API_KEY,
    });

  const reviewEvidence =
    reviewsWithText.map(
      (review, index) => ({
        reviewNumber:
          index + 1,

        rating:
          review.rating,

        text:
          review.text,
      })
    );

  const prompt = `
You are analyzing customer reviews for a business.

Use ONLY the supplied review evidence.

Identify meaningful themes in the supplied review evidence.

For each theme:
- Give a concise theme name.
- Count how many supplied reviews mention it.
- Classify sentiment as positive, mixed, or negative.
- Include short direct quotes from the supplied reviews.
- Assign evidenceStrength:
  - "limited" = 1 supplied review mentions the theme.
  - "moderate" = 2 supplied reviews mention the theme.
  - "strong" = 3 or more supplied reviews mention the theme.

Also identify:
- strengths
- weaknesses

Rules:
- Use ONLY the supplied review evidence.
- Do not invent facts.
- Do not infer information that is not present.
- Do not mention customer names.
- Keep quotes short and verbatim.
- Count mentions by supplied review, not by number of sentences or quotes.
- Do not call a theme "recurring", "consistent", "frequent", or similar unless at least 2 supplied reviews support it.
- With only 1 supporting review, treat the theme as a limited signal, not a recurring pattern.
- Do not create a theme merely because a single review contains an isolated detail unless that detail is useful as an explicit limited signal.
- If there is not enough evidence for a theme, do not create it.
- Keep strengths and weaknesses evidence-based. Do not describe something as a recurring strength or weakness unless at least 2 supplied reviews support it.

Review evidence:

${JSON.stringify(
  reviewEvidence,
  null,
  2
)}
`;

  const response =
    await ai.interactions.create({
      model:
        GEMINI_MODEL,

      input:
        prompt,

      response_format: {
        type: 'text',

        mime_type:
          'application/json',

        schema:
          reviewAnalysisSchema,
      },
    });

  const text =
    response.output_text;

  if (!text) {
    throw new Error(
      'Gemini returned an empty response.'
    );
  }

  const parsed =
    JSON.parse(text);

  const normalizedEvidenceText =
    reviewsWithText.map((review) =>
      review.text
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
    );

  const themes =
    (parsed.themes ?? [])
      .map((theme) => {
        const quotes =
          Array.isArray(theme.quotes)
            ? theme.quotes
                .filter(
                  (quote) =>
                    typeof quote === 'string' &&
                    quote.trim().length > 0
                )
                .map((quote) => quote.trim())
            : [];

        // Keep only quotes that actually occur
        // in the supplied review evidence.
        const verifiedQuotes =
          quotes.filter((quote) => {
            const normalizedQuote =
              quote
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .trim();

            return normalizedEvidenceText.some(
              (reviewText) =>
                reviewText.includes(normalizedQuote)
            );
          });

        const mentions =
          Math.max(
            0,
            Number(theme.mentions) || 0
          );

        const evidenceStrength =
          mentions >= 3
            ? 'strong'
            : mentions === 2
              ? 'moderate'
              : 'limited';

        return {
          ...theme,
          mentions,
          quotes: verifiedQuotes,
          evidenceStrength,
        };
      })
      .filter(
        (theme) =>
          theme.mentions > 0 &&
          theme.quotes.length > 0
      );

  return {
    themes,

    strengths:
      parsed.strengths ?? [],

    weaknesses:
      parsed.weaknesses ?? [],

    analysisNote:
      'Themes, strengths, and weaknesses were generated from the supplied review text using Gemini. Evidence strength is based on the number of supplied reviews supporting each theme.',
  };
}

// =========================================================
// SAFE GEMINI ANALYSIS
// =========================================================

async function safeAnalyseReviewsWithGemini(
  reviews
) {
  try {
    return await analyseReviewsWithGemini(
      reviews
    );
  } catch (error) {
    console.error(
      'Gemini analysis failed:',
      error.message
    );

    return {
      themes: [],
      strengths: [],
      weaknesses: [],

      analysisNote:
        'Semantic analysis was unavailable for this run. Deterministic review metrics are still available.',

      analysisStatus:
        'unavailable',
    };
  }
}

// =========================================================
// REVIEW REPLY GENERATION
// =========================================================

async function generateReviewReplies(
  reviews
) {
  const negativeReviews =
    reviews.filter(
      (review) =>
        review.rating <= 3 &&
        review.text.length > 0
    );

  if (
    negativeReviews.length === 0
  ) {
    return [];
  }

  if (!GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured.'
    );
  }

  const {
    GoogleGenAI,
  } = await import(
    '@google/genai'
  );

  const ai =
    new GoogleGenAI({
      apiKey:
        GEMINI_API_KEY,
    });

  const replies = [];

  for (
    const review of negativeReviews
  ) {
    const prompt = `
Draft a professional response to this negative customer review.

Rules:
- Write 2 to 3 sentences.
- Be calm and non-defensive.
- Acknowledge the customer's experience.
- Do not make excuses.
- Do not promise specific outcomes.
- Do not mention private information.
- Do not invent facts.
- Match the seriousness of the review.
- Do not mention the customer's name.
- Do not claim that the business has already taken action unless the review says so.

Review:
${JSON.stringify({
  rating: review.rating,
  text: review.text,
})}
`;

    const response =
      await ai.interactions.create({
        model:
          GEMINI_MODEL,

        input:
          prompt,

        response_format: {
          type: 'text',
          mime_type:
            'application/json',

          schema: {
            type: 'object',

            properties: {
              suggestedReply: {
                type: 'string',
              },
            },

            required: [
              'suggestedReply',
            ],
          },
        },
      });

    const text =
      response.output_text;

    if (!text) {
      continue;
    }

    const parsed =
      JSON.parse(text);

    if (
      typeof parsed.suggestedReply ===
      'string' &&
      parsed.suggestedReply.trim()
    ) {
      replies.push({
        reviewId:
          review.id,

        suggestedReply:
          parsed.suggestedReply.trim(),
      });
    }
  }

  return replies;
}

// =========================================================
// SAFE REVIEW REPLY GENERATION
// =========================================================

async function safeGenerateReviewReplies(
  reviews
) {
  try {
    return await generateReviewReplies(
      reviews
    );
  } catch (error) {
    console.error(
      'Review reply generation failed:',
      error.message
    );

    return [];
  }
}

// =========================================================
// COMPETITOR TYPES
// =========================================================

const SUPPORTED_COMPETITOR_TYPES =
  new Set([
    'hotel',
    'resort_hotel',
    'bed_and_breakfast',
    'hostel',
    'motel',
    'inn',
    'guest_house',
    'restaurant',
    'cafe',
    'bar',
    'bakery',
    'spa',
    'gym',
    'dentist',
    'doctor',
    'hospital',
    'school',
    'university',
    'shopping_mall',
    'store',
  ]);

// =========================================================
// GET COMPETITOR TYPE
// =========================================================

function getCompetitorType(
  place,
  details
) {
  if (
    place?.primaryType &&
    SUPPORTED_COMPETITOR_TYPES.has(
      place.primaryType
    )
  ) {
    return place.primaryType;
  }

  const types =
    details?.types ?? [];

  for (
    const type of types
  ) {
    if (
      SUPPORTED_COMPETITOR_TYPES.has(
        type
      )
    ) {
      return type;
    }
  }

  if (
    types.includes('lodging')
  ) {
    return 'hotel';
  }

  return 'lodging';
}

// =========================================================
// SAMPLE VELOCITY
// =========================================================

function calculateSampleVelocity(
  reviews
) {
  const dated =
    reviews
      .filter(
        (review) =>
          review.date
      )
      .sort(
        (a, b) =>
          new Date(
            a.date
          ).getTime() -
          new Date(
            b.date
          ).getTime()
      );

  if (
    dated.length < 2
  ) {
    return {
      perMonth: null,
      trend:
        'insufficient_data',
    };
  }

  const first =
    new Date(
      dated[0].date
    );

  const last =
    new Date(
      dated[
        dated.length - 1
      ].date
    );

  const elapsedDays =
    Math.max(
      1,
      (
        last.getTime() -
        first.getTime()
      ) /
        (
          1000 *
          60 *
          60 *
          24
        )
    );

  const elapsedMonths =
    elapsedDays / 30.44;

  return {
    perMonth:
      Number(
        (
          dated.length /
          elapsedMonths
        ).toFixed(2)
      ),

    trend:
      'insufficient_data',
  };
}

// =========================================================
// FIND COMPETITORS
// =========================================================

async function findCompetitors({
  place,
  details,
}) {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error(
      'Google Places API key is not configured.'
    );
  }

  const latitude =
    details?.geometry?.location?.lat;

  const longitude =
    details?.geometry?.location?.lng;

  if (
    typeof latitude !==
      'number' ||
    typeof longitude !==
      'number'
  ) {
    throw new Error(
      'Business location is unavailable.'
    );
  }

  const type =
    getCompetitorType(
      place,
      details
    );

  const response =
    await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'X-Goog-Api-Key':
            GOOGLE_PLACES_API_KEY,

          'X-Goog-FieldMask':
            [
              'places.id',
              'places.displayName',
              'places.formattedAddress',
              'places.rating',
              'places.userRatingCount',
              'places.primaryType',
              'places.location',
            ].join(','),
        },

        body: JSON.stringify({
          includedPrimaryTypes: [
            type,
          ],

          maxResultCount:
            10,

          locationRestriction: {
            circle: {
              center: {
                latitude,
                longitude,
              },

              radius:
                5000,
            },
          },
        }),
      },

      12000
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        'Nearby Search failed.'
    );
  }

  const competitors =
    (data.places ?? [])
      .filter(
        (candidate) =>
          candidate.id !==
          place.id
      )
      .slice(0, 4);

  return {
    competitors,

    searchType:
      type,

    note:
      `Comparable businesses were searched within 5 km using the "${type}" place type.`,
  };
}

// =========================================================
// GET COMPETITOR REVIEWS
// =========================================================

async function getCompetitorReviews(
  placeId
) {
  const url =
    new URL(
      'https://maps.googleapis.com/maps/api/place/details/json'
    );

  url.searchParams.set(
    'place_id',
    placeId
  );

  url.searchParams.set(
    'fields',
    'reviews'
  );

  url.searchParams.set(
    'reviews_sort',
    'newest'
  );

  url.searchParams.set(
    'key',
    GOOGLE_PLACES_LEGACY_API_KEY
  );

  const response =
    await fetchWithTimeout(
      url,
      {},
      10000
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    data.status !== 'OK'
  ) {
    throw new Error(
      data.error_message ??
        'Competitor review request failed.'
    );
  }

  return deduplicateReviews(
    normalizeReviews(
      data.result?.reviews ??
        []
    )
  );
}

// =========================================================
// BUILD COMPETITOR COMPARISON
// =========================================================

async function buildCompetitorComparison(
  competitors
) {
  if (
    !Array.isArray(competitors) ||
    competitors.length === 0
  ) {
    return [];
  }

  const results = [];

  for (
    const competitor of competitors
  ) {
    try {
      const reviews =
        await getCompetitorReviews(
          competitor.id
        );

      const metrics =
        calculateReviewMetrics(
          reviews
        );

      results.push({
        name:
          competitor.displayName?.text ??
          competitor.name ??
          'Unknown competitor',

        rating:
          typeof competitor.rating ===
          'number'
            ? competitor.rating
            : null,

        reviewCount:
          typeof competitor.userRatingCount ===
          'number'
            ? competitor.userRatingCount
            : null,

        responseRate:
          null,

        responseRateStatus:
          'unavailable',

        velocity:
          metrics.velocity?.perMonth ??
          null,

        velocityTrend:
          metrics.velocity?.trend ??
          'insufficient_data',

        reviewsCollected:
          reviews.length,

        velocitySampleBased:
          true,

        note:
          'Competitor review velocity is calculated from the limited Google review sample only.',
      });
    } catch (error) {
      console.error(
        `Competitor analysis failed for ${
          competitor.displayName?.text ??
          competitor.name ??
          'unknown'
        }:`,
        error.message
      );

      results.push({
        name:
          competitor.displayName?.text ??
          competitor.name ??
          'Unknown competitor',

        rating:
          typeof competitor.rating ===
          'number'
            ? competitor.rating
            : null,

        reviewCount:
          typeof competitor.userRatingCount ===
          'number'
            ? competitor.userRatingCount
            : null,

        responseRate:
          null,

        responseRateStatus:
          'unavailable',

        velocity:
          null,

        velocityTrend:
          'insufficient_data',

        reviewsCollected:
          0,

        velocitySampleBased:
          true,

        note:
          'Competitor review data was unavailable for this business.',
      });
    }
  }

  return results;
}

// =========================================================
// ANALYSE BUSINESS
// =========================================================

app.post('/analyse', async (req, res) => {
  try {
    const {
      businessName,
      location,
    } = req.body ?? {};

    const businessNameTrimmed =
      String(businessName).trim();

    const locationTrimmed =
      String(location).trim();

      if (
        businessNameTrimmed.length === 0 ||
        locationTrimmed.length === 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'businessName and location cannot be empty.',
          });
      }

      // -----------------------------------------------------
      // GOOGLE TEXT SEARCH
      // -----------------------------------------------------

      if (!GOOGLE_PLACES_API_KEY) {
        return res
          .status(500)
          .json({
            error:
              'Google Places API key is not configured.',
          });
      }

      const searchResponse =
        await fetchWithTimeout(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'X-Goog-Api-Key':
                GOOGLE_PLACES_API_KEY,

              'X-Goog-FieldMask':
                [
                  'places.id',
                  'places.displayName',
                  'places.formattedAddress',
                  'places.primaryType',
                  'places.types',
                  'places.rating',
                  'places.userRatingCount',
                  'places.location',
                ].join(','),
            },

            body: JSON.stringify({
              textQuery:
                `${businessNameTrimmed}, ${locationTrimmed}`,

              maxResultCount:
                10,
            }),
          },
          15000
        );

      const searchData =
        await searchResponse.json();

      if (!searchResponse.ok) {
        return res
          .status(502)
          .json({
            error:
              searchData.error?.message ??
              'Google Places search failed.',
          });
      }

      let places =
        searchData.places ??
        [];

      // -----------------------------------------------------
      // BUSINESS FALLBACK RESOLUTION
      // -----------------------------------------------------

      places =
        await resolveBusinessCandidates({
          places,
          businessName:
            businessNameTrimmed,
          location:
            locationTrimmed,
        });

      if (
        places.length === 0
      ) {
        return res
          .status(404)
          .json({
            error:
              'No matching business was found.',
          });
      }

      const selectedBusiness =
        selectBestBusinessCandidate(
          places,
          businessNameTrimmed,
          locationTrimmed
        );

      if (
        !selectedBusiness?.id
      ) {
        return res
          .status(404)
          .json({
            error:
              'Unable to resolve a valid business.',
          });
      }

      console.log(
        'FINAL SELECTED BUSINESS:',
        {
          id:
            selectedBusiness.id,

          name:
            selectedBusiness
              .displayName?.text,

          rating:
            selectedBusiness.rating,

          reviewCount:
            selectedBusiness
              .userRatingCount,

          address:
            selectedBusiness
              .formattedAddress,

          primaryType:
            selectedBusiness
              .primaryType,
        }
      );

      // -----------------------------------------------------
      // GOOGLE LEGACY PLACE DETAILS
      // Used because the assignment requires actual
      // review text and the current Places flow only exposes
      // a limited review sample.
      // -----------------------------------------------------

      if (
        !GOOGLE_PLACES_LEGACY_API_KEY
      ) {
        return res
          .status(500)
          .json({
            error:
              'Google Places Legacy API key is not configured.',
          });
      }

      const detailsUrl =
        new URL(
          'https://maps.googleapis.com/maps/api/place/details/json'
        );

      detailsUrl.searchParams.set(
        'place_id',
        selectedBusiness.id
      );

      detailsUrl.searchParams.set(
        'fields',
        [
          'place_id',
          'name',
          'rating',
          'user_ratings_total',
          'formatted_address',
          'geometry',
          'type',
          'types',
          'reviews',
          'url',
        ].join(',')
      );

      detailsUrl.searchParams.set(
        'reviews_sort',
        'newest'
      );

      detailsUrl.searchParams.set(
        'key',
        GOOGLE_PLACES_LEGACY_API_KEY
      );

      const detailsResponse =
        await fetchWithTimeout(
          detailsUrl,
          {},
          15000
        );

      const detailsData =
        await detailsResponse.json();

      if (
        !detailsResponse.ok ||
        detailsData.status !== 'OK'
      ) {
        return res
          .status(502)
          .json({
            error:
              detailsData.error_message ??
              'Google Place Details request failed.',
          });
      }

      const details =
        detailsData.result ??
        {};

      // -----------------------------------------------------
      // NORMALIZE + DEDUPLICATE REVIEWS
      // -----------------------------------------------------

      const rawReviews =
        details.reviews ??
        [];

      const reviews =
        deduplicateReviews(
          normalizeReviews(
            rawReviews
          )
        );

      console.log(
        'REVIEWS COLLECTED:',
        reviews.length
      );

      console.log(
        'REVIEWS WITH TEXT:',
        reviews.filter(
          (review) =>
            review.text.length > 0
        ).length
      );

      // -----------------------------------------------------
      // DETERMINISTIC REVIEW METRICS
      // -----------------------------------------------------

      const metrics =
        calculateReviewMetrics(
          reviews
        );

      // -----------------------------------------------------
      // SAMPLE VELOCITY
      // -----------------------------------------------------

      const sampleVelocity =
        calculateSampleVelocity(
          reviews
        );

      // -----------------------------------------------------
      // PARALLEL ANALYSIS
      // -----------------------------------------------------

      const [
        semanticAnalysis,
        competitorSearch,
        suggestedReplies,
      ] =
        await Promise.all([
          safeAnalyseReviewsWithGemini(
            reviews
          ),

          findCompetitors({
            place:
              selectedBusiness,

            details,
          }).catch(
            (error) => {
              console.error(
                'Competitor search failed:',
                error.message
              );

              return {
                competitors: [],
                searchType:
                  null,
                note:
                  'Competitor search was unavailable for this run.',
              };
            }
          ),

          safeGenerateReviewReplies(
            reviews
          ),
        ]);

      // -----------------------------------------------------
      // COMPETITOR COMPARISON
      // -----------------------------------------------------

      let competitors = [];

      if (
        competitorSearch?.competitors
          ?.length
      ) {
        competitors =
          await buildCompetitorComparison(
            competitorSearch.competitors
          );
      }

      // -----------------------------------------------------
      // BUSINESS RESPONSE RATE
      // -----------------------------------------------------
      //
      // Google Places review objects do not expose a reliable
      // owner-response field. Therefore we do not estimate
      // response rate from missing data.
      // -----------------------------------------------------

      const responseRate =
        null;

      const responseRateStatus =
        'unavailable';

      const responseRateNote =
        'Google Places review data does not expose business-owner response status.';

      // -----------------------------------------------------
      // NEGATIVE REVIEW SUMMARY
      // -----------------------------------------------------

      const negativeReviews =
        reviews.filter(
          (review) =>
            review.rating <= 3
        );

      const negativeReviewsWithText =
        negativeReviews.filter(
          (review) =>
            review.text.length > 0
        );

      const negativeReviewSummary = {
        total:
          negativeReviews.length,

        withText:
          negativeReviewsWithText.length,

        withoutText:
          negativeReviews.length -
          negativeReviewsWithText.length,

        note:
          negativeReviews.length === 0
            ? 'No negative reviews were present in the collected Google review sample.'
            : negativeReviewsWithText.length === 0
              ? 'Negative reviews were present, but none contained usable review text in the collected sample.'
              : 'Negative review counts are based on the collected Google review sample.',
      };

      // -----------------------------------------------------
      // UNANSWERED REVIEWS
      // -----------------------------------------------------
      //
      // Important:
      // Google Places does not expose owner-response status,
      // so these cannot honestly be labelled "unanswered".
      //
      // We therefore expose eligible negative reviews while
      // explicitly marking response status as unknown.
      // -----------------------------------------------------

      const unanswered =
        negativeReviewsWithText.map(
          (review) => {
            const generatedReply =
              suggestedReplies.find(
                (reply) =>
                  reply.reviewId ===
                  review.id
              );

            return {
              reviewId:
                review.id,

              rating:
                review.rating,

              text:
                review.text,

              suggestedReply:
                generatedReply
                  ?.suggestedReply ??
                null,

              responseStatus:
                'unknown',

              responseStatusNote:
                'Google Places does not expose whether the business has already responded to this review.',
            };
          }
        );

      // -----------------------------------------------------
      // SOURCE INFORMATION
      // -----------------------------------------------------

      const sources = [
        {
          platform:
            'Google Places API (Legacy)',

          reviewsCollected:
            reviews.length,

          method:
            'Place Details with reviews_sort=newest',

          reliability:
            'Primary Google review data for the resolved business.',

          durability:
            'Google Places exposes only a limited review sample; this implementation does not claim to represent the full review history.',

          limitation:
            'Review response status and full review history are not available through this endpoint.',
        },
      ];

      // -----------------------------------------------------
      // PROCESSING NOTES
      // -----------------------------------------------------

      const processing = {
        reviewSample:
          `Analysed ${reviews.length} Google review(s), of which ${metrics.reviewsWithText} contained text.`,

        reviewDataQuality:
          'Reviews were normalized, validated, and deduplicated before analysis.',

        velocity:
          'Review velocity is calculated from the collected sample only and should not be interpreted as the business full historical review velocity.',

        semanticAnalysis:
          semanticAnalysis.analysisNote,

        competitors:
          competitorSearch.note,

        partialFailures:
          'Partial failures in semantic analysis, reply generation, or competitor review collection do not invalidate the deterministic business metrics.',
      };

      // -----------------------------------------------------
      // BUILD FINAL RESPONSE
      // -----------------------------------------------------

      const responsePayload = {
        business: {
          name:
            details.name ??
            selectedBusiness
              .displayName?.text ??
            businessNameTrimmed,

          rating:
            details.rating ??
            selectedBusiness.rating ??
            null,

          reviewCount:
            details.user_ratings_total ??
            selectedBusiness
              .userRatingCount ??
            null,

          lastReviewDate:
            metrics.reviewDates.last,

          address:
            details.formatted_address ??
            selectedBusiness
              .formattedAddress ??
            null,

          placeId:
            details.place_id ??
            selectedBusiness.id ??
            null,

          url:
            details.url ??
            null,
        },

        dataQuality: {
          totalBusinessReviews:
            details.user_ratings_total ??
            selectedBusiness.userRatingCount ??
            null,

          reviewsCollected:
            reviews.length,

          reviewsWithText:
            metrics.reviewsWithText,

          analysisCoverage:
            metrics.reviewsWithText >= 20
              ? 'good'
              : 'limited',

          note:
            'Google Places returns a limited review sample. Metrics and semantic analysis describe the available sample, not the full review history.',

          velocityNote:
            'Review velocity is calculated from the collected sample only and should not be interpreted as the business full historical review velocity.',
        },

        sources,

        metrics,

        distribution:
          metrics.ratingDistribution,

        velocity: {
          perMonth:
            sampleVelocity.perMonth,

          trend:
            sampleVelocity.trend,

          monthsCovered:
            metrics.velocity
              .monthsCovered,

          sampleBased:
            true,

          note:
            'Calculated from the limited collected Google review sample only.',
        },

        themes:
          semanticAnalysis.themes ??
          [],

        strengths:
          semanticAnalysis.strengths ??
          [],

        weaknesses:
          semanticAnalysis.weaknesses ??
          [],

        negativeReviewSummary,

        unanswered,

        suggestedReplies,

        competitors,

        responseRate,

        responseRateStatus,

        responseRateNote,

        reviews,

        processing,
      };

      console.log(
        'ANALYSIS COMPLETE:',
        {
          business:
            responsePayload
              .business.name,

          rating:
            responsePayload
              .business.rating,

          totalReviewCount:
            responsePayload
              .business.reviewCount,

          reviewsSampled:
            reviews.length,

          reviewsWithText:
            metrics.reviewsWithText,

          themes:
            responsePayload
              .themes.length,

          competitors:
            competitors.length,

          suggestedReplies:
            suggestedReplies.length,
        }
      );

      return res.json(
        responsePayload
      );
    } catch (error) {
      console.error(
        'ANALYSIS ERROR:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            error.message ??
            'Unexpected analysis error.',
        });
    }
  }
);

// =========================================================
// START SERVER
// =========================================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `NeuraLake Reputation API running on port ${PORT}`
    );
  }
);