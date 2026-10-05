const mongoose = require('mongoose');

/**
 * Generates round-robin fixtures
 * @param {Array} teams - Array of team objects with _id
 * @returns {Array} - Array of { round, teamA, teamB }
 */
const generateRoundRobin = (teams, tournamentId) => {
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

    for (let i = 0; i < half; i++) {
      const teamA = i === 0 ? pivot : rotatingTeams[i - 1];
      const teamB = rotatingTeams[rotatingTeams.length - 1 - i];

      if (teamA && teamB) {
        fixtures.push({
          tournamentId,
          round,
          roundName: `Round ${round}`,
          teamA: teamA._id,
          teamB: teamB._id,
          status: 'scheduled',
        });
      }
    }

    rotatingTeams.unshift(rotatingTeams.pop());
  }

  return fixtures;
};

/**
 * Generate full single-elimination knockout tournament with all bracket rounds
 * Generates Round 1, Quarter-Finals, Semi-Finals, and Final as linked placeholders.
 * @param {Array} teams - Array of team objects with _id
 * @param {ObjectId} tournamentId
 * @returns {Array} - Array of linked fixture documents
 */
const generateKnockout = (teams, tournamentId) => {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);

  // Pad to nearest power of 2
  const totalSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(2, shuffled.length))));
  const totalRounds = Math.log2(totalSlots);

  const getRoundName = (roundNum, totalRounds) => {
    const remaining = totalRounds - roundNum + 1;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semi-Final';
    if (remaining === 3) return 'Quarter-Final';
    return `Round ${roundNum}`;
  };

  const allFixtures = [];
  let round1Fixtures = [];

  // Round 1: Pair up initial teams
  for (let i = 0; i < totalSlots; i += 2) {
    const teamA = shuffled[i] || null;
    const teamB = shuffled[i + 1] || null;

    const fixId = new mongoose.Types.ObjectId();
    const fixture = {
      _id: fixId,
      tournamentId,
      round: 1,
      roundName: getRoundName(1, totalRounds),
      teamA: teamA ? teamA._id : null,
      teamB: teamB ? teamB._id : null,
      sourceFixtureA: null,
      sourceFixtureB: null,
      status: 'scheduled',
    };

    // If one team has a bye, auto-advance or mark status
    round1Fixtures.push(fixture);
    allFixtures.push(fixture);
  }

  // Subsequent rounds: Create placeholder fixtures linked to source fixtures
  let previousRoundFixtures = round1Fixtures;

  for (let r = 2; r <= totalRounds; r++) {
    const nextRoundFixtures = [];
    for (let i = 0; i < previousRoundFixtures.length; i += 2) {
      const srcA = previousRoundFixtures[i];
      const srcB = previousRoundFixtures[i + 1];

      const fixId = new mongoose.Types.ObjectId();
      const fixture = {
        _id: fixId,
        tournamentId,
        round: r,
        roundName: getRoundName(r, totalRounds),
        teamA: null, // Populated dynamically upon winner advancement
        teamB: null,
        sourceFixtureA: srcA ? srcA._id : null,
        sourceFixtureB: srcB ? srcB._id : null,
        status: 'scheduled',
      };

      nextRoundFixtures.push(fixture);
      allFixtures.push(fixture);
    }
    previousRoundFixtures = nextRoundFixtures;
  }

  return allFixtures;
};

/**
 * Generate Group Round-Robin + Knockout (Phase 4.2)
 * Divides teams into groups (A & B) for round-robin, then creates knockout finals
 */
const generateGroupKnockout = (teams, tournamentId) => {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const half = Math.ceil(shuffled.length / 2);
  const groupA = shuffled.slice(0, half);
  const groupB = shuffled.slice(half);

  const fixturesA = generateRoundRobin(groupA, tournamentId).map(f => ({ ...f, group: 'A', roundName: `Group A - ${f.roundName}` }));
  const fixturesB = generateRoundRobin(groupB, tournamentId).map(f => ({ ...f, group: 'B', roundName: `Group B - ${f.roundName}` }));

  const maxGroupRound = Math.max(
    ...fixturesA.map(f => f.round),
    ...fixturesB.map(f => f.round),
    1
  );

  // Knockout playoffs (Semi-Finals & Final)
  const semi1Id = new mongoose.Types.ObjectId();
  const semi2Id = new mongoose.Types.ObjectId();
  const finalId = new mongoose.Types.ObjectId();

  const semiFinal1 = {
    _id: semi1Id,
    tournamentId,
    round: maxGroupRound + 1,
    roundName: 'Semi-Final 1 (Winner A vs Runner-up B)',
    teamA: null,
    teamB: null,
    status: 'scheduled',
  };

  const semiFinal2 = {
    _id: semi2Id,
    tournamentId,
    round: maxGroupRound + 1,
    roundName: 'Semi-Final 2 (Winner B vs Runner-up A)',
    teamA: null,
    teamB: null,
    status: 'scheduled',
  };

  const finalMatch = {
    _id: finalId,
    tournamentId,
    round: maxGroupRound + 2,
    roundName: 'Final',
    teamA: null,
    teamB: null,
    sourceFixtureA: semi1Id,
    sourceFixtureB: semi2Id,
    status: 'scheduled',
  };

  return [...fixturesA, ...fixturesB, semiFinal1, semiFinal2, finalMatch];
};

module.exports = {
  generateRoundRobin,
  generateKnockout,
  generateGroupKnockout,
};
