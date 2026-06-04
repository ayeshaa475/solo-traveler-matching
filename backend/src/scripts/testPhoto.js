require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (!apiKey) { console.error('GOOGLE_PLACES_API_KEY not set'); process.exit(1); }

(async () => {
  // Step 1: Text Search
  const query = 'The Metropolitan Museum of Art New York';
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  console.log('=== Step 1: Text Search ===');
  console.log('URL:', searchUrl.replace(apiKey, 'KEY_REDACTED'));

  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  console.log('\nStatus:', searchData.status);
  console.log('Results count:', searchData.results?.length ?? 0);

  if (!searchData.results?.length) {
    console.log('No results returned.'); process.exit(0);
  }

  const place = searchData.results[0];
  console.log('\nTop result:', place.name);
  console.log('photos array:', JSON.stringify(place.photos ?? null, null, 2));

  const photoRef = place.photos?.[0]?.photo_reference ?? null;
  if (!photoRef) {
    console.log('\nNo photo_reference found on this result.'); process.exit(0);
  }

  // Step 2: Places Photo URL (manual redirect — do NOT follow)
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;
  console.log('\n=== Step 2: Places Photo (redirect: manual) ===');
  console.log('URL:', photoUrl.replace(apiKey, 'KEY_REDACTED'));

  const photoRes = await fetch(photoUrl, { redirect: 'manual' });
  console.log('\nResponse status:', photoRes.status);
  console.log('Response type:', photoRes.type);

  const allHeaders = {};
  photoRes.headers.forEach((v, k) => { allHeaders[k] = v; });
  console.log('All response headers:', JSON.stringify(allHeaders, null, 2));

  const location = photoRes.headers.get('location') ?? null;
  console.log('\nLocation header:', location);

  // Step 3: Follow redirect manually to see final URL
  if (location) {
    console.log('\n=== Step 3: Follow redirect manually ===');
    const finalRes = await fetch(location, { redirect: 'follow' });
    console.log('Final URL after follow:', finalRes.url);
    console.log('Final status:', finalRes.status);
    console.log('Content-Type:', finalRes.headers.get('content-type'));
    await finalRes.body?.cancel();

    console.log('\n=== Verdict ===');
    const isStaticMap = location.includes('staticmap') || finalRes.url.includes('staticmap');
    const isRealPhoto = finalRes.url.includes('lh3.googleusercontent.com') || finalRes.url.includes('lh5.googleusercontent') || location.includes('lh3');
    if (isStaticMap) {
      console.log('RESULT: static map tile — photo_reference redirects to a map, not a venue photo');
    } else if (isRealPhoto) {
      console.log('RESULT: real photo — redirects to Google user-content CDN ✓');
    } else {
      console.log('RESULT: unknown destination —', finalRes.url);
    }
  } else {
    console.log('\nNo Location header — redirect did not occur as expected.');
    console.log('Response body (first 500 chars):');
    const text = await photoRes.text();
    console.log(text.substring(0, 500));
  }
})();
