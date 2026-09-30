/**
 * Generates round-robin or knockout fixtures for a tournament.
 */

/**
 * Generate round-robin fixtures
 * @param {Array} teams - Array of team objects with _id
 * @returns {Array} - Array of { round, teamA, teamB }
 */
const generateRoundRobin = (teams) => {
  const fixtures = [];
  const teamList = [...teams];

  // Add a BYE if odd number of teams
  if (teamList.length % 2 !== 0) teamList.push(null);

  const n = teamList.length;
  const rounds = n - 1;
  const half = n / 2;

  const rotatingTeams = teamList.slice(1);

  for (let round = 1; round <= rounds; round++) {
    const pivot = teamList[0];
    const roundFixtures = [];

    for (let i = 0; i < half; i++) {
      const teamA = i === 0 ? pivot : rotatingTeams[i - 1];
      const teamB = rotatingTeams[rotatingTeams.length - i];

      if (teamA && teamB) {
        roundFixtures.push({ round, teamA: teamA._id, teamB: teamB._id });
      }
    }

    fixtures.push(...roundFixtures);
    rotatingTeams.unshift(rotatingTeams.pop());
  }

  return fixtures;
};

/**
 * Generate single-elimination knockout fixtures
 * @param {Array} teams - Array of team objects with _id
 * @returns {Array} - Array of { round, teamA, teamB, roundName }
 */
const generateKnockout = (teams) => {
  const fixtures = [];
  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  // Pad to next power of 2
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  while (shuffled.length < nextPow2) shuffled.push(null);

  let currentRound = shuffled;
  let roundNum = 1;
  const totalRounds = Math.log2(nextPow2);

  const getRoundName = (roundNum, totalRounds) => {
    const remaining = totalRounds - roundNum + 1;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semi-Final';
    if (remaining === 3) return 'Quarter-Final';
    return `Round ${roundNum}`;
  };

  while (currentRound.length > 1) {
    const roundFixtures = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      const teamA = currentRound[i];
      const teamB = currentRound[i + 1];
      if (teamA && teamB) {
        roundFixtures.push({
          round: roundNum,
          roundName: getRoundName(roundNum, totalRounds),
          teamA: teamA._id,
          teamB: teamB._id,
        });
      }
    }
    fixtures.push(...roundFixtures);
    currentRound = currentRound.filter((_, idx) => idx % 2 === 0); // placeholder winners
    roundNum++;
  }

  return fixtures;
};

module.exports = { generateRoundRobin, generateKnockout };
