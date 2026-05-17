const scoreMatches = (sourceActivity, candidates) => {
  const sourceInterests = sourceActivity.user.interests || [];

  return candidates
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

      return { activity: candidate, matchScore: score, sharedInterests };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = { scoreMatches };
