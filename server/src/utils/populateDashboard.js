require('dotenv').config();
const mongoose = require('mongoose');

// Models
const Association = require('../models/Association');
const User = require('../models/User');
const Team = require('../models/Team');
const Ground = require('../models/Ground');
const Tournament = require('../models/Tournament');
const TournamentRegistration = require('../models/TournamentRegistration');
const Fixture = require('../models/Fixture');
const Match = require('../models/Match');
const MatchResult = require('../models/MatchResult');
const Standing = require('../models/Standing');
const ExpenseRequest = require('../models/ExpenseRequest');
const Fund = require('../models/Fund');
const Booking = require('../models/Booking');
const Group = require('../models/Group');
const FriendlyMatch = require('../models/FriendlyMatch');
const PlayerStat = require('../models/PlayerStat');
const TeamStat = require('../models/TeamStat');

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sports';
  console.log(`Connecting to database at ${uri}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to database at ${uri}`);
  } catch (err) {
    console.log(`Connection to ${uri} failed (${err.message}). Trying fallback mongodb://127.0.0.1:27017/sports...`);
    await mongoose.connect('mongodb://127.0.0.1:27017/sports', { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to database at mongodb://127.0.0.1:27017/sports');
  }
}

async function populateDashboardData() {
  try {
    await connectToDatabase();

    console.log('--- Cleaning previous demo dataset ---');
    // Remove previous demo entries with deterministic prefix or clear
    const demoTag = '[DEMO]';
    await Association.deleteMany({ name: new RegExp(`^${demoTag}|Cricket Sports Association|National Ultimate League`) });
    await Ground.deleteMany({ name: new RegExp(`^${demoTag}|Main Stadium`) });
    await Tournament.deleteMany({ name: new RegExp(`^${demoTag}|Summer Championship`) });

    // 1. Create System Admin if missing
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@sports.com',
        passwordHash: 'password123',
        role: 'admin',
        status: 'active'
      });
      console.log('Created System Admin:', admin.email);
    }

    // 2. Associations: Cricket and Football
    const cricketAssoc = await Association.create({
      name: `${demoTag} Premier Cricket Association`,
      description: 'Governing body for regional premier cricket leagues, youth academies, and seasonal tournaments.',
      sportsSupported: ['cricket'],
      headUserId: admin._id,
      address: '100 Pavilion Way, Sports City',
      contactInfo: 'cricket-admin@sports.com',
      status: 'active'
    });

    const footballAssoc = await Association.create({
      name: `${demoTag} Metro Football Association`,
      description: 'Regional football governing authority overseeing premier division clubs and grassroot cups.',
      sportsSupported: ['football'],
      headUserId: admin._id,
      address: '200 Arena Boulevard, Metro District',
      contactInfo: 'football-admin@sports.com',
      status: 'active'
    });

    // 3. Officers & Role Users
    const rolesConfig = [
      { name: 'Cricket Head', email: 'head@cricket.com', role: 'association_head', assocId: cricketAssoc._id },
      { name: 'Cricket Organizer', email: 'organizer@cricket.com', role: 'tournament_organizer', assocId: cricketAssoc._id },
      { name: 'Cricket Ground Officer', email: 'ground@cricket.com', role: 'ground_officer', assocId: cricketAssoc._id },
      { name: 'Cricket Funds Officer', email: 'funds@cricket.com', role: 'funds_officer', assocId: cricketAssoc._id },
      { name: 'Football Head', email: 'head@football.com', role: 'association_head', assocId: footballAssoc._id },
      { name: 'Football Organizer', email: 'organizer@football.com', role: 'tournament_organizer', assocId: footballAssoc._id },
      { name: 'Football Ground Officer', email: 'ground@football.com', role: 'ground_officer', assocId: footballAssoc._id },
      { name: 'Football Funds Officer', email: 'funds@football.com', role: 'funds_officer', assocId: footballAssoc._id },
    ];

    const usersMap = {};
    for (const r of rolesConfig) {
      let u = await User.findOne({ email: r.email });
      if (!u) {
        u = await User.create({
          name: r.name,
          email: r.email,
          passwordHash: 'password123',
          role: r.role,
          associationId: r.assocId,
          status: 'active'
        });
      } else {
        u.role = r.role;
        u.associationId = r.assocId;
        await u.save();
      }
      usersMap[r.email] = u;
    }

    // Link real association head IDs
    cricketAssoc.headUserId = usersMap['head@cricket.com']._id;
    await cricketAssoc.save();
    footballAssoc.headUserId = usersMap['head@football.com']._id;
    await footballAssoc.save();

    // 4. Grounds: 3 Grounds with maintenanceWindows, sportsSupported, hourlyRate
    const grounds = await Ground.create([
      {
        name: `${demoTag} Central Oval Stadium`,
        associationId: cricketAssoc._id,
        location: 'North Ring Road, Sports Complex',
        sportsSupported: ['cricket'],
        capacity: 15000,
        hourlyRate: 1500,
        amenities: ['Floodlights', 'Pavilion', 'Digital Scoreboard', 'Practice Nets', 'Locker Rooms'],
        maintenanceWindows: [
          { startDate: new Date(Date.now() + 86400000 * 5), endDate: new Date(Date.now() + 86400000 * 5 + 3600000 * 4), reason: 'Pitch Rolling & Watering' },
          { startDate: new Date(Date.now() + 86400000 * 8), endDate: new Date(Date.now() + 86400000 * 8 + 3600000 * 3), reason: 'Outfield Maintenance' }
        ],
        status: 'active'
      },
      {
        name: `${demoTag} City Arena Pitch`,
        associationId: cricketAssoc._id,
        location: 'Downtown Center, Gate 3',
        sportsSupported: ['cricket', 'football'],
        capacity: 8000,
        hourlyRate: 1200,
        amenities: ['Floodlights', 'Covered Seating', 'Dressing Rooms', 'Broadcast Booth'],
        maintenanceWindows: [
          { startDate: new Date(Date.now() + 86400000 * 6), endDate: new Date(Date.now() + 86400000 * 6 + 3600000 * 2), reason: 'Turf Inspection & Lining' }
        ],
        status: 'active'
      },
      {
        name: `${demoTag} Riverside Football Complex`,
        associationId: footballAssoc._id,
        location: 'Riverside Drive, Pier 4',
        sportsSupported: ['football'],
        capacity: 10000,
        hourlyRate: 1000,
        amenities: ['FIFA Grade Turf', 'Floodlights', 'Medical Room', 'Spectator Stands'],
        maintenanceWindows: [
          { startDate: new Date(Date.now() + 86400000 * 7), endDate: new Date(Date.now() + 86400000 * 7 + 3600000 * 2), reason: 'Grass Trimming' }
        ],
        status: 'active'
      }
    ]);
    console.log(`Created ${grounds.length} Grounds with maintenance windows.`);

    // 5. 8 Teams with Full Rosters (4 Cricket, 4 Football)
    const teamConfigs = [
      // Cricket Teams
      { name: `${demoTag} Royal Challengers XI`, sport: 'cricket', assoc: cricketAssoc, capEmail: 'rc_cap@cricket.com', vcEmail: 'rc_vc@cricket.com', prefix: 'rc' },
      { name: `${demoTag} Thunderbolts CC`, sport: 'cricket', assoc: cricketAssoc, capEmail: 'tb_cap@cricket.com', vcEmail: 'tb_vc@cricket.com', prefix: 'tb' },
      { name: `${demoTag} Apex Strikers`, sport: 'cricket', assoc: cricketAssoc, capEmail: 'as_cap@cricket.com', vcEmail: 'as_vc@cricket.com', prefix: 'as' },
      { name: `${demoTag} Titans Cricket Club`, sport: 'cricket', assoc: cricketAssoc, capEmail: 'ti_cap@cricket.com', vcEmail: 'ti_vc@cricket.com', prefix: 'ti' },
      // Football Teams
      { name: `${demoTag} City United FC`, sport: 'football', assoc: footballAssoc, capEmail: 'cu_cap@football.com', vcEmail: 'cu_vc@football.com', prefix: 'cu' },
      { name: `${demoTag} Metro Strikers`, sport: 'football', assoc: footballAssoc, capEmail: 'ms_cap@football.com', vcEmail: 'ms_vc@football.com', prefix: 'ms' },
      { name: `${demoTag} Phoenix FC`, sport: 'football', assoc: footballAssoc, capEmail: 'ph_cap@football.com', vcEmail: 'ph_vc@football.com', prefix: 'ph' },
      { name: `${demoTag} Vanguard FC`, sport: 'football', assoc: footballAssoc, capEmail: 'vg_cap@football.com', vcEmail: 'vg_vc@football.com', prefix: 'vg' },
    ];

    const seededTeams = [];
    for (const tc of teamConfigs) {
      // 1. Captain
      let cap = await User.findOne({ email: tc.capEmail });
      if (!cap) {
        cap = await User.create({
          name: `${tc.name.split(' ').slice(1, 3).join(' ')} Captain`,
          email: tc.capEmail,
          passwordHash: 'password123',
          role: 'captain',
          associationId: tc.assoc._id,
          status: 'active'
        });
      }

      // 2. Vice Captain
      let vc = await User.findOne({ email: tc.vcEmail });
      if (!vc) {
        vc = await User.create({
          name: `${tc.name.split(' ').slice(1, 3).join(' ')} Vice Captain`,
          email: tc.vcEmail,
          passwordHash: 'password123',
          role: 'vice_captain',
          associationId: tc.assoc._id,
          status: 'active'
        });
      }

      // 3. Players
      const playerIds = [cap._id, vc._id];
      for (let i = 1; i <= 3; i++) {
        const pEmail = `${tc.prefix}_player${i}@${tc.sport}.com`;
        let p = await User.findOne({ email: pEmail });
        if (!p) {
          p = await User.create({
            name: `${tc.prefix.toUpperCase()} Player ${i}`,
            email: pEmail,
            passwordHash: 'password123',
            role: 'player',
            associationId: tc.assoc._id,
            status: 'active'
          });
        }
        playerIds.push(p._id);
      }

      // Create / Update Team
      let team = await Team.findOne({ name: tc.name });
      if (!team) {
        team = await Team.create({
          name: tc.name,
          sport: tc.sport,
          associationId: tc.assoc._id,
          captainId: cap._id,
          viceCaptainId: vc._id,
          players: playerIds,
          status: 'approved'
        });
      } else {
        team.captainId = cap._id;
        team.viceCaptainId = vc._id;
        team.players = playerIds;
        team.status = 'approved';
        await team.save();
      }

      // Update users teamId
      await User.updateMany({ _id: { $in: playerIds } }, { teamId: team._id });

      // Create team chat group
      let group = await Group.findOne({ refId: team._id });
      if (!group) {
        await Group.create({
          type: 'team',
          refId: team._id,
          name: `${team.name} Squad Chat`,
          members: playerIds,
          adminIds: [cap._id, vc._id]
        });
      }

      // Seed TeamStat
      await TeamStat.findOneAndUpdate(
        { teamId: team._id },
        {
          teamId: team._id,
          associationId: tc.assoc._id,
          sport: tc.sport,
          matchesPlayed: 10,
          matchesWon: 6,
          matchesLost: 3,
          matchesTied: 1,
          winPercentage: 60,
          recentForm: ['W', 'W', 'L', 'W', 'D']
        },
        { upsert: true }
      );

      seededTeams.push(team);
    }
    console.log(`Created 8 Teams with full rosters & stats.`);

    const cricketTeams = seededTeams.filter(t => t.sport === 'cricket');
    const footballTeams = seededTeams.filter(t => t.sport === 'football');

    // 6. Tournaments: 1 Cricket Knockout, 1 Football Round-Robin
    const cricketTourn = await Tournament.create({
      name: `${demoTag} Metro T20 Knockout Championship`,
      sport: 'cricket',
      associationId: cricketAssoc._id,
      organizerId: usersMap['organizer@cricket.com']._id,
      status: 'ongoing',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 7),
      registrationDeadline: new Date(Date.now() - 86400000),
      format: 'knockout',
      maxTeams: 4,
      registrationFee: 2500,
      rules: 'ICC T20 Standard Rules. 20 overs per side. Super Over for ties.',
      prizeInfo: 'Winner: $5,000 & Trophy, Runner-Up: $2,500',
      description: 'Annual premier regional cricket championship featuring top 4 clubs.'
    });

    const footballTourn = await Tournament.create({
      name: `${demoTag} State Football Super League`,
      sport: 'football',
      associationId: footballAssoc._id,
      organizerId: usersMap['organizer@football.com']._id,
      status: 'ongoing',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 14),
      registrationDeadline: new Date(Date.now() - 86400000),
      format: 'round_robin',
      maxTeams: 4,
      registrationFee: 2000,
      rules: 'FIFA Standard 90 min match rules. 3 points for win, 1 for draw.',
      prizeInfo: 'Champions Cup and Gold Medals.',
      description: 'Round-robin state football league tournament.'
    });

    // Register 4 cricket teams with snapshots
    for (const ct of cricketTeams) {
      await TournamentRegistration.create({
        tournamentId: cricketTourn._id,
        teamId: ct._id,
        status: 'approved',
        submittedBy: ct.captainId,
        verifiedBy: usersMap['organizer@cricket.com']._id,
        registrationFeeStatus: 'paid',
        rosterSnapshot: ct.players.map(pid => ({ userId: pid, name: 'Player', role: 'player' }))
      });
    }

    // Register 4 football teams & init Standings
    for (const [idx, ft] of footballTeams.entries()) {
      await TournamentRegistration.create({
        tournamentId: footballTourn._id,
        teamId: ft._id,
        status: 'approved',
        submittedBy: ft.captainId,
        verifiedBy: usersMap['organizer@football.com']._id,
        registrationFeeStatus: 'paid',
        rosterSnapshot: ft.players.map(pid => ({ userId: pid, name: 'Footballer', role: 'player' }))
      });

      await Standing.create({
        tournamentId: footballTourn._id,
        teamId: ft._id,
        rank: idx + 1,
        played: 2,
        won: idx === 0 ? 2 : 1,
        lost: idx === 3 ? 2 : 0,
        tied: 0,
        points: (idx === 0 ? 6 : (idx === 3 ? 0 : 3)),
        goalsFor: 4 - idx,
        goalsAgainst: idx,
        goalDifference: (4 - 2 * idx),
        streak: ['W', 'L']
      });
    }
    console.log('Created Tournaments, Registrations & Standings.');

    // 7. Knockout Fixtures for Cricket Tournament
    const sf1 = await Fixture.create({
      tournamentId: cricketTourn._id,
      round: 1,
      roundName: 'Semi Final 1',
      matchNumber: 1,
      teamA: cricketTeams[0]._id,
      teamB: cricketTeams[1]._id,
      groundId: grounds[0]._id,
      scheduledDate: new Date(),
      scheduledTime: '14:00',
      status: 'scheduled'
    });

    const sf2 = await Fixture.create({
      tournamentId: cricketTourn._id,
      round: 1,
      roundName: 'Semi Final 2',
      matchNumber: 2,
      teamA: cricketTeams[2]._id,
      teamB: cricketTeams[3]._id,
      groundId: grounds[1]._id,
      scheduledDate: new Date(Date.now() - 86400000),
      scheduledTime: '10:00',
      status: 'completed'
    });

    const finalFix = await Fixture.create({
      tournamentId: cricketTourn._id,
      round: 2,
      roundName: 'Final',
      matchNumber: 3,
      teamA: cricketTeams[2]._id,
      teamB: null,
      groundId: grounds[0]._id,
      scheduledDate: new Date(Date.now() + 86400000 * 2),
      scheduledTime: '18:00',
      status: 'scheduled'
    });
    console.log('Created Knockout Fixtures for Cricket Tournament.');

    // 8. Completed Cricket Match with Full Scorecard & MatchResult
    const completedCricketMatch = await Match.create({
      sport: 'cricket',
      type: 'tournament',
      fixtureId: sf2._id,
      refId: cricketTourn._id,
      tournamentId: cricketTourn._id,
      teamA: cricketTeams[2]._id,
      teamB: cricketTeams[3]._id,
      groundId: grounds[1]._id,
      associationId: cricketAssoc._id,
      status: 'completed',
      tossWinner: cricketTeams[2]._id,
      tossDecision: 'bat',
      totalOvers: 20,
      winnerId: cricketTeams[2]._id,
      resultSummary: `${cricketTeams[2].name} won by 18 runs`,
      startedAt: new Date(Date.now() - 86400000),
      endedAt: new Date(Date.now() - 86400000 + 10800000),
      playingXI: {
        teamA: cricketTeams[2].players,
        teamB: cricketTeams[3].players
      },
      innings: [
        {
          battingTeamId: cricketTeams[2]._id,
          bowlingTeamId: cricketTeams[3]._id,
          totalRuns: 168,
          wickets: 6,
          overs: 20,
          completed: true,
          extras: { wide: 4, noBall: 2, bye: 1, legBye: 3, penalty: 0, total: 10 },
          fallOfWickets: [
            { wicket: 1, runs: 32, batsmanId: cricketTeams[2].players[0], over: 4.2 },
            { wicket: 2, runs: 75, batsmanId: cricketTeams[2].players[1], over: 9.1 },
            { wicket: 3, runs: 110, batsmanId: cricketTeams[2].players[2], over: 14.0 }
          ],
          balls: [
            { ballNum: 1, over: 0, runs: 4, isBoundary: true, batsmanId: cricketTeams[2].players[0], bowlerId: cricketTeams[3].players[0], commentary: 'Driven through extra cover for four!' },
            { ballNum: 2, over: 0, runs: 1, batsmanId: cricketTeams[2].players[0], bowlerId: cricketTeams[3].players[0], commentary: 'Single to deep midwicket' },
            { ballNum: 3, over: 0, runs: 6, isSix: true, batsmanId: cricketTeams[2].players[1], bowlerId: cricketTeams[3].players[0], commentary: 'Massive six over long-on!' }
          ]
        },
        {
          battingTeamId: cricketTeams[3]._id,
          bowlingTeamId: cricketTeams[2]._id,
          totalRuns: 150,
          wickets: 9,
          overs: 20,
          targetRuns: 169,
          completed: true,
          extras: { wide: 3, noBall: 1, bye: 2, legBye: 2, penalty: 0, total: 8 },
          fallOfWickets: [
            { wicket: 1, runs: 12, batsmanId: cricketTeams[3].players[0], over: 2.1 }
          ],
          balls: [
            { ballNum: 1, over: 0, runs: 0, batsmanId: cricketTeams[3].players[0], bowlerId: cricketTeams[2].players[0] }
          ]
        }
      ]
    });

    const matchResultRecord = await MatchResult.create({
      matchId: completedCricketMatch._id,
      winnerTeamId: cricketTeams[2]._id,
      loserTeamId: cricketTeams[3]._id,
      resultType: 'win',
      marginText: 'by 18 runs',
      marginValue: 18,
      playerOfMatchId: cricketTeams[2].players[0],
      finalizedBy: usersMap['organizer@cricket.com']._id,
      inningsSummary: [
        { teamId: cricketTeams[2]._id, score: { totalRuns: 168, wickets: 6, overs: 20 } },
        { teamId: cricketTeams[3]._id, score: { totalRuns: 150, wickets: 9, overs: 20 } }
      ]
    });

    completedCricketMatch.resultId = matchResultRecord._id;
    await completedCricketMatch.save();

    // 9. Live Cricket Match with Active Balls & Lineups
    const liveCricketMatch = await Match.create({
      sport: 'cricket',
      type: 'tournament',
      fixtureId: sf1._id,
      refId: cricketTourn._id,
      tournamentId: cricketTourn._id,
      teamA: cricketTeams[0]._id,
      teamB: cricketTeams[1]._id,
      groundId: grounds[0]._id,
      associationId: cricketAssoc._id,
      status: 'live',
      tossWinner: cricketTeams[0]._id,
      tossDecision: 'bat',
      totalOvers: 20,
      startedAt: new Date(Date.now() - 3600000), // started 1 hr ago
      scorerId: usersMap['organizer@cricket.com']._id,
      scorerLockedAt: new Date(),
      playingXI: {
        teamA: cricketTeams[0].players,
        teamB: cricketTeams[1].players
      },
      currentBatsmen: {
        strikerId: cricketTeams[1].players[2],
        nonStrikerId: cricketTeams[1].players[3]
      },
      currentBowlerId: cricketTeams[0].players[4],
      previousBowlerId: cricketTeams[0].players[3],
      currentInning: 1,
      innings: [
        // Inning 1 completed
        {
          battingTeamId: cricketTeams[0]._id,
          bowlingTeamId: cricketTeams[1]._id,
          totalRuns: 165,
          wickets: 7,
          overs: 20,
          completed: true,
          extras: { wide: 5, noBall: 1, bye: 2, legBye: 4, penalty: 0, total: 12 },
          fallOfWickets: [
            { wicket: 1, runs: 28, batsmanId: cricketTeams[0].players[0], over: 3.4 },
            { wicket: 2, runs: 82, batsmanId: cricketTeams[0].players[1], over: 9.5 }
          ],
          balls: [
            { ballNum: 1, over: 0, runs: 4, isBoundary: true, batsmanId: cricketTeams[0].players[0], bowlerId: cricketTeams[1].players[0] }
          ]
        },
        // Inning 2 Live in Progress (Target: 166, currently 118/3 in 14.2 ov)
        {
          battingTeamId: cricketTeams[1]._id,
          bowlingTeamId: cricketTeams[0]._id,
          totalRuns: 118,
          wickets: 3,
          overs: 14.2,
          targetRuns: 166,
          completed: false,
          extras: { wide: 4, noBall: 0, bye: 1, legBye: 1, penalty: 0, total: 6 },
          fallOfWickets: [
            { wicket: 1, runs: 30, batsmanId: cricketTeams[1].players[0], over: 3.1 },
            { wicket: 2, runs: 65, batsmanId: cricketTeams[1].players[1], over: 7.4 },
            { wicket: 3, runs: 98, batsmanId: cricketTeams[1].players[4], over: 11.3 }
          ],
          balls: [
            { ballNum: 1, over: 14, runs: 1, batsmanId: cricketTeams[1].players[2], bowlerId: cricketTeams[0].players[4], commentary: 'Turned into the on-side for a single.' },
            { ballNum: 2, over: 14, runs: 4, isBoundary: true, batsmanId: cricketTeams[1].players[3], bowlerId: cricketTeams[0].players[4], commentary: 'Smashed past point! Beautiful boundary.' }
          ]
        }
      ]
    });
    console.log('Created Live Cricket Match and Completed Cricket Match.');

    // 10. Completed Football Match
    const completedFootballMatch = await Match.create({
      sport: 'football',
      type: 'tournament',
      tournamentId: footballTourn._id,
      teamA: footballTeams[0]._id,
      teamB: footballTeams[1]._id,
      groundId: grounds[2]._id,
      associationId: footballAssoc._id,
      status: 'completed',
      winnerId: footballTeams[0]._id,
      resultSummary: `${footballTeams[0].name} won 2 - 1`,
      scoreSummary: { scoreA: 2, scoreB: 1 },
      startedAt: new Date(Date.now() - 86400000 * 2),
      endedAt: new Date(Date.now() - 86400000 * 2 + 7200000),
      events: [
        { type: 'goal', teamId: footballTeams[0]._id, playerId: footballTeams[0].players[0], data: { minute: 23 } },
        { type: 'goal', teamId: footballTeams[1]._id, playerId: footballTeams[1].players[0], data: { minute: 44 } },
        { type: 'goal', teamId: footballTeams[0]._id, playerId: footballTeams[0].players[1], data: { minute: 78 } }
      ]
    });

    await MatchResult.create({
      matchId: completedFootballMatch._id,
      winnerTeamId: footballTeams[0]._id,
      loserTeamId: footballTeams[1]._id,
      resultType: 'win',
      marginText: '2 - 1',
      marginValue: 1,
      inningsSummary: [
        { teamId: footballTeams[0]._id, score: { goals: 2 } },
        { teamId: footballTeams[1]._id, score: { goals: 1 } }
      ]
    });

    // 11. Friendly Match
    await FriendlyMatch.create({
      requestingTeamId: cricketTeams[0]._id,
      respondingTeamId: cricketTeams[2]._id,
      sport: 'cricket',
      groundId: grounds[1]._id,
      date: new Date(Date.now() + 86400000 * 3),
      time: '15:00',
      status: 'accepted',
      createdBy: cricketTeams[0].captainId
    });

    // 12. Bookings & Fair Allocation
    await Booking.create([
      {
        groundId: grounds[0]._id,
        teamId: cricketTeams[0]._id,
        requestedBy: cricketTeams[0].captainId,
        date: new Date(Date.now() + 86400000),
        startTime: '10:00',
        endTime: '13:00',
        purpose: 'tournament',
        status: 'approved',
        fairScore: 82,
        scoreBreakdown: { hoursUsedScore: 30, daysSinceLastUsedScore: 25, shareScore: 20, tournamentBonus: 7 }
      },
      {
        groundId: grounds[2]._id,
        teamId: footballTeams[0]._id,
        requestedBy: footballTeams[0].captainId,
        date: new Date(Date.now() + 86400000 * 2),
        startTime: '16:00',
        endTime: '18:00',
        purpose: 'practice',
        status: 'pending',
        fairScore: 65,
        scoreBreakdown: { hoursUsedScore: 25, daysSinceLastUsedScore: 20, shareScore: 20, tournamentBonus: 0 }
      }
    ]);

    // 13. Expense Requests & Funds Ledger
    // Structured expense requests
    await ExpenseRequest.create([
      {
        associationId: cricketAssoc._id,
        requestedBy: usersMap['ground@cricket.com']._id,
        purpose: 'Pitch heavy roller engine overhaul and winter turf seeds',
        category: 'ground_maintenance',
        amount: 4500,
        status: 'approved',
        approvedBy: cricketAssoc.headUserId,
        approvedAt: new Date(Date.now() - 86400000)
      },
      {
        associationId: cricketAssoc._id,
        requestedBy: usersMap['organizer@cricket.com']._id,
        purpose: 'Grade A match leather balls and replacement stumps',
        category: 'equipment',
        amount: 8500,
        status: 'pending'
      },
      {
        associationId: cricketAssoc._id,
        requestedBy: usersMap['organizer@cricket.com']._id,
        purpose: 'Certified ICC panel umpire honorarium for 3 fixtures',
        category: 'umpire_fee',
        amount: 6000,
        status: 'paid',
        approvedBy: cricketAssoc.headUserId,
        approvedAt: new Date(Date.now() - 86400000 * 3),
        paidBy: usersMap['funds@cricket.com']._id,
        paidAt: new Date(Date.now() - 86400000 * 2),
        paymentRef: 'EXP-UMP-2026-001'
      }
    ]);

    // Funds entries
    await Fund.create([
      {
        associationId: cricketAssoc._id,
        type: 'income',
        category: 'sponsorship',
        amount: 50000,
        description: 'Season Title Sponsorship from Metro Sports Corp',
        status: 'completed',
        requestedBy: cricketAssoc.headUserId,
        receiptStatus: 'generated'
      },
      {
        associationId: cricketAssoc._id,
        type: 'income',
        category: 'tournament_fee',
        amount: 10000,
        description: 'Registration fees for Metro T20 Knockout Championship',
        status: 'completed',
        requestedBy: usersMap['organizer@cricket.com']._id,
        receiptStatus: 'generated'
      },
      {
        associationId: cricketAssoc._id,
        type: 'expense',
        category: 'expense',
        amount: 6000,
        description: 'Umpire Honorarium paid for tournament fixtures',
        status: 'completed',
        requestedBy: usersMap['funds@cricket.com']._id,
        receiptStatus: 'generated'
      },
      {
        associationId: footballAssoc._id,
        type: 'income',
        category: 'tournament_fee',
        amount: 8000,
        description: 'Entry fees for State Football Super League',
        status: 'completed',
        requestedBy: usersMap['organizer@football.com']._id,
        receiptStatus: 'generated'
      }
    ]);
    console.log('Created Expense Requests and Funds Ledger Entries.');

    console.log('\n======================================================');
    console.log('DEMO DATASET POPULATED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Available Login Credentials (all passwords: "password123"):');
    console.log('- System Admin: admin@sports.com');
    console.log('- Cricket Head: head@cricket.com');
    console.log('- Cricket Organizer: organizer@cricket.com');
    console.log('- Cricket Ground Officer: ground@cricket.com');
    console.log('- Cricket Funds Officer: funds@cricket.com');
    console.log('- Team Captains: rc_cap@cricket.com, tb_cap@cricket.com, cu_cap@football.com');
    console.log('- Team Vice Captains: rc_vc@cricket.com, tb_vc@cricket.com');
    console.log('- Players: rc_player1@cricket.com, etc.');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Failed to populate demo dashboard data:', err);
    process.exit(1);
  }
}

populateDashboardData();
