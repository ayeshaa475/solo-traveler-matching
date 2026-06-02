const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const scoreMatches = (sourceActivity, candidates) => {
  const sourceInterests = sourceActivity.user.interests || [];
  const srcLat = sourceActivity.location?.lat;
  const srcLng = sourceActivity.location?.lng;
  const srcHasCoords = srcLat != null && srcLng != null;

  return candidates
    .filter((candidate) => {
      const candLat = candidate.location?.lat;
      const candLng = candidate.location?.lng;
      const candHasCoords = candLat != null && candLng != null;

      if (srcHasCoords && candHasCoords) {
        return haversineDistance(srcLat, srcLng, candLat, candLng) <= 25;
      }
      // fall back to city text comparison
      return (candidate.city || '').toLowerCase() === (sourceActivity.city || '').toLowerCase();
    })
    .map((candidate) => {
      let score = 0;

      const sharedInterests = (candidate.user.interests || []).filter((i) =>
        sourceInterests.includes(i)
      );
      score += sharedInterests.length * 10;

      const daysDiff = Math.abs(
        (new Date(candidate.date) - new Date(sourceActivity.date)) / (1000 * 60 * 60 * 24)
      );
      score += Math.max(0, 10 - daysDiff * 5);

      // Trust bonus: ±5 points relative to baseline trust score of 50
      const trustScore = candidate.user.trustScore ?? 50;
      score += (trustScore - 50) / 10;

      return { activity: candidate, matchScore: score, sharedInterests };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = { scoreMatches };
