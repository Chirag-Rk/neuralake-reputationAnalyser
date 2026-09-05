require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_LEGACY_API_KEY =
  process.env.GOOGLE_PLACES_LEGACY_API_KEY;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NeuraLake Reputation API',
  });
});

app.post('/analyse', async (req, res) => {
  const { businessName, location } = req.body;

  if (!businessName || !location) {
    return res.status(400).json({
      error: 'Business name and location are required.',
    });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return res.status(500).json({
      error: 'Google Places API (New) key is not configured.',
    });
  }

  if (!GOOGLE_PLACES_LEGACY_API_KEY) {
    return res.status(500).json({
      error: 'Google Places API (Legacy) key is not configured.',
    });
  }

  try {
    // ---------------------------------------------------------
    // 1. FIND BUSINESS USING PLACES API (NEW)
    // ---------------------------------------------------------

    const searchResponse = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress',
        },
        body: JSON.stringify({
          textQuery: `${businessName}, ${location}`,
          maxResultCount: 5,
        }),
      }
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Google Text Search error:', searchData);

      return res.status(502).json({
        error: 'Google Places search failed.',
        details:
          searchData.error?.message ?? 'Unknown Google API error.',
      });
    }

    const places = searchData.places ?? [];

    if (places.length === 0) {
      return res.status(404).json({
        error: `No business found for "${businessName}" in "${location}".`,
      });
    }

    const place = places[0];

    console.log('FOUND BUSINESS:');
    console.log(JSON.stringify(place, null, 2));

    // ---------------------------------------------------------
    // 2. GET RATING + REVIEWS USING PLACES API (LEGACY)
    // ---------------------------------------------------------

    const legacyUrl = new URL(
      'https://maps.googleapis.com/maps/api/place/details/json'
    );

    legacyUrl.searchParams.set('place_id', place.id);
    legacyUrl.searchParams.set(
      'fields',
      'place_id,name,formatted_address,rating,user_ratings_total,reviews'
    );
    legacyUrl.searchParams.set('reviews_sort', 'newest');
    legacyUrl.searchParams.set(
      'key',
      GOOGLE_PLACES_LEGACY_API_KEY
    );

    const legacyResponse = await fetch(legacyUrl);

    const legacyData = await legacyResponse.json();

    console.log('LEGACY GOOGLE STATUS:', legacyResponse.status);
    console.log(
      'LEGACY GOOGLE RESPONSE:',
      JSON.stringify(legacyData, null, 2)
    );

    if (!legacyResponse.ok) {
      return res.status(502).json({
        error: 'Google Places Legacy request failed.',
        details:
          legacyData.error_message ??
          'Unknown Google API error.',
      });
    }

    if (legacyData.status !== 'OK') {
      return res.status(502).json({
        error: 'Google Places Legacy returned an error.',
        details:
          legacyData.error_message ??
          legacyData.status ??
          'Unknown Google API error.',
      });
    }

    const details = legacyData.result ?? {};

    const reviews = details.reviews ?? [];

    // ---------------------------------------------------------
    // 3. RETURN NORMALIZED DATA TO MOBILE APP
    // ---------------------------------------------------------

    return res.json({
      business: {
        name:
          details.name ??
          place.displayName?.text ??
          businessName,

        address:
          details.formatted_address ??
          place.formattedAddress ??
          location,

        placeId:
          details.place_id ??
          place.id,

        rating: details.rating ?? null,

        reviewCount:
          details.user_ratings_total ?? null,

        lastReviewDate:
          reviews.length > 0
            ? reviews[0].time
              ? new Date(reviews[0].time * 1000).toISOString()
              : null
            : null,
      },

      sources: [
        {
          platform: 'Google Places API (Legacy)',
          reviewsCollected: reviews.length,
          method:
            'Places API (New) Text Search + Places API (Legacy) Place Details',
        },
      ],

      reviews,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    return res.status(500).json({
      error: 'Unexpected server error.',
      details: error.message,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `NeuraLake API running on http://localhost:${PORT}`
  );
});