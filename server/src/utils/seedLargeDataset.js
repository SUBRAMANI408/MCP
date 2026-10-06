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
const Sport = require('../models/Sport');

// Precomputed bcrypt hash for 'password123' (work factor 10) so inserting 300+ users completes instantly
const PRECOMPUTED_PASSWORD_HASH = '$2a$10$gsmJBNGYiv0hu65mgcKHwOcevEIIMG4nM1JWfsARH.5bQLe1YcFpm';

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

// 12 Cricket Team Definitions
const CRICKET_TEAMS_DATA = [
  { name: 'Royal Challengers Bangalore XI', code: 'RCB', colors: 'Red & Gold', city: 'Bangalore' },
  { name: 'Chennai Super Kings XI', code: 'CSK', colors: 'Yellow & Blue', city: 'Chennai' },
  { name: 'Mumbai Indians XI', code: 'MI', colors: 'Blue & Gold', city: 'Mumbai' },
  { name: 'Kolkata Knight Riders XI', code: 'KKR', colors: 'Purple & Gold', city: 'Kolkata' },
  { name: 'Delhi Capitals XI', code: 'DC', colors: 'Blue & Red', city: 'Delhi' },
  { name: 'Sunrisers Hyderabad XI', code: 'SRH', colors: 'Orange & Black', city: 'Hyderabad' },
  { name: 'Rajasthan Royals XI', code: 'RR', colors: 'Pink & Blue', city: 'Jaipur' },
  { name: 'Punjab Kings XI', code: 'PBKS', colors: 'Crimson & Silver', city: 'Mohali' },
  { name: 'Gujarat Titans XI', code: 'GT', colors: 'Navy & Silver', city: 'Ahmedabad' },
  { name: 'Lucknow Super Giants XI', code: 'LSG', colors: 'Sky Blue & Orange', city: 'Lucknow' },
  { name: 'Thunderbolts Cricket Club', code: 'TCC', colors: 'Teal & Black', city: 'Pune' },
  { name: 'Apex Strikers Cricket Club', code: 'ASC', colors: 'Emerald & White', city: 'Nagpur' },
];

// 12 Football Team Definitions
const FOOTBALL_TEAMS_DATA = [
  { name: 'City United FC', code: 'CUFC', colors: 'Sky Blue & White', city: 'Manchester' },
  { name: 'Real Madrid FC Club', code: 'RMFC', colors: 'All White', city: 'Madrid' },
  { name: 'FC Barcelona Metro', code: 'FCBM', colors: 'Blaugrana', city: 'Barcelona' },
  { name: 'Liverpool Athletic FC', code: 'LAFC', colors: 'All Red', city: 'Liverpool' },
  { name: 'Bayern Munich Sports Club', code: 'BMSC', colors: 'Red & White', city: 'Munich' },
  { name: 'Paris Saint-Germain FC', code: 'PSG', colors: 'Navy & Red', city: 'Paris' },
  { name: 'Arsenal Gunners FC', code: 'AGFC', colors: 'Red & White', city: 'London' },
  { name: 'Juventus Strikers FC', code: 'JUVE', colors: 'Black & White', city: 'Turin' },
  { name: 'Inter Milan Warriors FC', code: 'IMFC', colors: 'Blue & Black', city: 'Milan' },
  { name: 'Borussia Dortmund FC', code: 'BDFC', colors: 'Yellow & Black', city: 'Dortmund' },
  { name: 'Chelsea Blues Athletic FC', code: 'CBAF', colors: 'Royal Blue', city: 'London' },
  { name: 'Atletico Madrid Rovers FC', code: 'ATMR', colors: 'Red, White & Blue', city: 'Madrid' },
];

// 12 Basketball Team Definitions
const BASKETBALL_TEAMS_DATA = [
  { name: 'Lakers United Basketball', code: 'LAL', colors: 'Purple & Gold', city: 'Los Angeles' },
  { name: 'Golden State Warriors BC', code: 'GSW', colors: 'Royal Blue & Yellow', city: 'San Francisco' },
  { name: 'Boston Celtics Club', code: 'BOS', colors: 'Green & White', city: 'Boston' },
  { name: 'Chicago Bulls BC', code: 'CHI', colors: 'Red & Black', city: 'Chicago' },
  { name: 'Miami Heat Club', code: 'MIA', colors: 'Black & Crimson', city: 'Miami' },
  { name: 'Brooklyn Nets BC', code: 'BKN', colors: 'Black & White', city: 'Brooklyn' },
  { name: 'Milwaukee Bucks BC', code: 'MIL', colors: 'Hunter Green & Cream', city: 'Milwaukee' },
  { name: 'Dallas Mavericks BC', code: 'DAL', colors: 'Royal Blue & Navy', city: 'Dallas' },
  { name: 'Phoenix Suns BC', code: 'PHX', colors: 'Purple & Orange', city: 'Phoenix' },
  { name: 'Toronto Raptors BC', code: 'TOR', colors: 'Red, Black & Silver', city: 'Toronto' },
  { name: 'Denver Nuggets BC', code: 'DEN', colors: 'Midnight Blue & Gold', city: 'Denver' },
  { name: 'Philadelphia 76ers BC', code: 'PHI', colors: 'Blue, Red & White', city: 'Philadelphia' },
];

async function seedLargeDataset() {
  try {
    await connectToDatabase();

    console.log('======================================================');
    console.log('SEEDING COMPREHENSIVE DATASET (10+ TEAMS PER SPORT)');
    console.log('======================================================');

    // 1. Seed Sports Master List if needed
    const sportsMaster = [
      { name: 'Cricket', icon: '🏏', isActive: true, scoringSchema: { rules: 'ICC Limited Overs', fields: [{ key: 'runs', label: 'Runs', type: 'number', required: true }, { key: 'wickets', label: 'Wickets', type: 'number', required: true }, { key: 'overs', label: 'Overs', type: 'number', required: true }] } },
      { name: 'Football', icon: '⚽', isActive: true, scoringSchema: { rules: 'FIFA 90 Mins', fields: [{ key: 'goals', label: 'Goals', type: 'number', required: true }, { key: 'shots', label: 'Shots', type: 'number', required: false }] } },
      { name: 'Basketball', icon: '🏀', isActive: true, scoringSchema: { rules: 'FIBA 4 Quarters', fields: [{ key: 'points', label: 'Points', type: 'number', required: true }, { key: 'rebounds', label: 'Rebounds', type: 'number', required: false }] } },
      { name: 'Volleyball', icon: '🏐', isActive: true, scoringSchema: { rules: 'Best of 5 Sets', fields: [{ key: 'sets', label: 'Sets Won', type: 'number', required: true }] } },
      { name: 'Tennis', icon: '🎾', isActive: true, scoringSchema: { rules: 'ITF Best of 3', fields: [{ key: 'sets', label: 'Sets Won', type: 'number', required: true }] } },
      { name: 'Badminton', icon: '🏸', isActive: true, scoringSchema: { rules: 'BWF 3x21', fields: [{ key: 'sets', label: 'Sets Won', type: 'number', required: true }] } },
    ];
    for (const sp of sportsMaster) {
      await Sport.findOneAndUpdate({ name: sp.name }, sp, { upsert: true });
    }
    console.log('✓ Verified Master Sports catalog.');

    // 2. Ensure Core 8 Roles users exist and are active
    const coreUsers = [
      { name: 'System Admin', email: 'admin@sports.com', role: 'admin', phone: '9000000001' },
      { name: 'Association Head', email: 'head@sports.com', role: 'association_head', phone: '9000000002' },
      { name: 'Tournament Organizer', email: 'organizer@sports.com', role: 'tournament_organizer', phone: '9000000003' },
      { name: 'Ground Officer', email: 'ground@sports.com', role: 'ground_officer', phone: '9000000004' },
      { name: 'Funds Officer', email: 'funds@sports.com', role: 'funds_officer', phone: '9000000005' },
      { name: 'Team Captain (cc1)', email: 'cc1@gmail.com', role: 'captain', phone: '9000000006' },
      { name: 'Vice Captain', email: 'vicecap@sports.com', role: 'vice_captain', phone: '9000000007' },
      { name: 'Regular Player', email: 'player@sports.com', role: 'player', phone: '9000000008' },
    ];

    for (const cu of coreUsers) {
      let existing = await User.findOne({ email: cu.email });
      if (!existing) {
        await User.collection.insertOne({
          name: cu.name,
          email: cu.email,
          passwordHash: PRECOMPUTED_PASSWORD_HASH,
          role: cu.role,
          phone: cu.phone,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await User.updateOne({ _id: existing._id }, { $set: { role: cu.role, status: 'active', passwordHash: PRECOMPUTED_PASSWORD_HASH } });
      }
    }
    console.log('✓ Ensured all 8 core platform role logins exist with password "password123".');

    const adminUser = await User.findOne({ email: 'admin@sports.com' });
    const headUser = await User.findOne({ email: 'head@sports.com' });
    const organizerUser = await User.findOne({ email: 'organizer@sports.com' });
    const groundOfficerUser = await User.findOne({ email: 'ground@sports.com' });
    const fundsOfficerUser = await User.findOne({ email: 'funds@sports.com' });
    const cc1Captain = await User.findOne({ email: 'cc1@gmail.com' });
    const viceCapUser = await User.findOne({ email: 'vicecap@sports.com' });
    const playerUser = await User.findOne({ email: 'player@sports.com' });

    // 3. Create or Update Associations (Cricket, Football, Basketball)
    const associations = [
      {
        name: 'National Premier Cricket Association',
        description: 'Governing body for National T20, First Class and youth premier cricket leagues.',
        sportsSupported: ['cricket'],
        headUserId: headUser._id,
        address: '100 Pavilion Boulevard, Sports Complex',
        contactInfo: 'cricket-admin@sports.com',
        status: 'active'
      },
      {
        name: 'Metropolitan Football Association',
        description: 'Regional football governing authority overseeing Premier division and cup tournaments.',
        sportsSupported: ['football'],
        headUserId: headUser._id,
        address: '200 Arena Way, Football City',
        contactInfo: 'football-admin@sports.com',
        status: 'active'
      },
      {
        name: 'National Basketball Association Federation',
        description: 'State basketball league coordinating championship divisions and club circuits.',
        sportsSupported: ['basketball'],
        headUserId: headUser._id,
        address: '300 Courtside Drive, Metro District',
        contactInfo: 'basketball-admin@sports.com',
        status: 'active'
      }
    ];

    const assocMap = {};
    for (const a of associations) {
      let assoc = await Association.findOne({ name: a.name });
      if (!assoc) {
        assoc = await Association.create(a);
      } else {
        assoc.sportsSupported = a.sportsSupported;
        assoc.headUserId = headUser._id;
        assoc.status = 'active';
        await assoc.save();
      }
      assocMap[a.sportsSupported[0]] = assoc;
    }
    console.log('✓ Associations verified for Cricket, Football, and Basketball.');

    // Link officers to cricket association by default
    await User.updateMany(
      { email: { $in: ['head@sports.com', 'organizer@sports.com', 'ground@sports.com', 'funds@sports.com', 'cc1@gmail.com', 'vicecap@sports.com', 'player@sports.com'] } },
      { $set: { associationId: assocMap['cricket']._id } }
    );

    // 4. Create Grounds
    const groundsData = [
      {
        name: 'Eden Gardens International Arena',
        associationId: assocMap['cricket']._id,
        location: 'North Ring Road, Gate 1',
        sportsSupported: ['cricket'],
        capacity: 65000,
        hourlyRate: 2500,
        amenities: ['Floodlights', 'LED Scoreboard', 'Practice Nets', 'VIP Lounge', 'Medical Center'],
        maintenanceWindows: [
          { startDate: new Date(Date.now() + 86400000 * 4), endDate: new Date(Date.now() + 86400000 * 4 + 14400000), reason: 'Pitch Rolling' }
        ],
        status: 'active'
      },
      {
        name: 'Wankhede Cricket Ground',
        associationId: assocMap['cricket']._id,
        location: 'Marine Way, South Pavilion',
        sportsSupported: ['cricket'],
        capacity: 33000,
        hourlyRate: 2000,
        amenities: ['Floodlights', 'Pavilion', 'Dressing Rooms', 'Broadcast Booth'],
        status: 'active'
      },
      {
        name: 'Chinnaswamy Sports Complex',
        associationId: assocMap['cricket']._id,
        location: 'MG Road Arena',
        sportsSupported: ['cricket'],
        capacity: 40000,
        hourlyRate: 1800,
        amenities: ['Sub-air Drainage', 'Floodlights', 'Indoor Nets'],
        status: 'active'
      },
      {
        name: 'Metropolitan Stadium Arena',
        associationId: assocMap['football']._id,
        location: 'West Boulevard, Gate 4',
        sportsSupported: ['football'],
        capacity: 50000,
        hourlyRate: 2200,
        amenities: ['FIFA Grade Turf', 'VAR System', 'Floodlights', 'Press Box'],
        status: 'active'
      },
      {
        name: 'Riverside Football Park',
        associationId: assocMap['football']._id,
        location: 'East Riverbank Road',
        sportsSupported: ['football'],
        capacity: 20000,
        hourlyRate: 1200,
        amenities: ['Natural Turf', 'Changing Rooms', 'Spectator Stands'],
        status: 'active'
      },
      {
        name: 'Olympic Basketball Dome',
        associationId: assocMap['basketball']._id,
        location: 'Downtown Center Court',
        sportsSupported: ['basketball'],
        capacity: 18000,
        hourlyRate: 1500,
        amenities: ['Hardwood Maple Floor', 'Shot Clocks', 'Air Conditioning', 'Locker Rooms'],
        status: 'active'
      }
    ];

    const grounds = [];
    for (const gd of groundsData) {
      let g = await Ground.findOne({ name: gd.name });
      if (!g) {
        g = await Ground.create(gd);
      }
      grounds.push(g);
    }
    console.log(`✓ Seeded ${grounds.length} Premier Grounds.`);

    // 5. Helper function to create 12 full teams for a sport
    async function seedTeamsForSport(sportName, assoc, teamDefs, specialCapUser, specialVcUser, specialPlayerUser) {
      console.log(`\n--- Seeding 12 Full Teams for ${sportName.toUpperCase()} ---`);
      const seededSportTeams = [];

      for (let tIdx = 0; tIdx < teamDefs.length; tIdx++) {
        const tDef = teamDefs[tIdx];
        const prefix = `${tDef.code.toLowerCase()}_${sportName.slice(0, 3)}`;

        // Determine captain & vice captain
        let cap, vc;
        if (tIdx === 0 && specialCapUser) {
          cap = specialCapUser;
        } else {
          const capEmail = `${prefix}_cap@sports.com`;
          cap = await User.findOne({ email: capEmail });
          if (!cap) {
            const insRes = await User.collection.insertOne({
              name: `${tDef.name} Captain`,
              email: capEmail,
              passwordHash: PRECOMPUTED_PASSWORD_HASH,
              role: 'captain',
              associationId: assoc._id,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            cap = await User.findById(insRes.insertedId);
          }
        }

        if (tIdx === 0 && specialVcUser) {
          vc = specialVcUser;
        } else {
          const vcEmail = `${prefix}_vc@sports.com`;
          vc = await User.findOne({ email: vcEmail });
          if (!vc) {
            const insRes = await User.collection.insertOne({
              name: `${tDef.name} Vice Captain`,
              email: vcEmail,
              passwordHash: PRECOMPUTED_PASSWORD_HASH,
              role: 'vice_captain',
              associationId: assoc._id,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            vc = await User.findById(insRes.insertedId);
          }
        }

        // Create 11 full players per team (including cap & vc + 9 other players)
        const teamPlayerIds = [cap._id, vc._id];

        // If team 0, include the test regular player
        if (tIdx === 0 && specialPlayerUser) {
          teamPlayerIds.push(specialPlayerUser._id);
        }

        const playersNeeded = 11 - teamPlayerIds.length;
        for (let pNum = 1; pNum <= playersNeeded; pNum++) {
          const pEmail = `${prefix}_p${pNum}@sports.com`;
          let p = await User.findOne({ email: pEmail });
          if (!p) {
            const insRes = await User.collection.insertOne({
              name: `${tDef.code} Player ${pNum}`,
              email: pEmail,
              passwordHash: PRECOMPUTED_PASSWORD_HASH,
              role: 'player',
              associationId: assoc._id,
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            p = await User.findById(insRes.insertedId);
          }
          teamPlayerIds.push(p._id);
        }

        // Upsert Team
        let team = await Team.findOne({ name: tDef.name });
        if (!team) {
          team = await Team.create({
            name: tDef.name,
            sport: sportName,
            associationId: assoc._id,
            captainId: cap._id,
            viceCaptainId: vc._id,
            players: teamPlayerIds,
            status: 'approved',
            description: `${tDef.city} based championship squad. Colors: ${tDef.colors}`,
            matchesPlayed: 10 + tIdx,
            wins: 6 + (tIdx % 4),
            losses: 3,
            draws: 1
          });
        } else {
          team.captainId = cap._id;
          team.viceCaptainId = vc._id;
          team.players = teamPlayerIds;
          team.status = 'approved';
          team.associationId = assoc._id;
          await team.save();
        }

        // Assign teamId on all team members
        await User.updateMany({ _id: { $in: teamPlayerIds } }, { $set: { teamId: team._id, associationId: assoc._id } });

        // Seed TeamStat
        await TeamStat.findOneAndUpdate(
          { teamId: team._id },
          {
            teamId: team._id,
            associationId: assoc._id,
            sport: sportName,
            matchesPlayed: 10,
            matchesWon: 6 + (tIdx % 3),
            matchesLost: 3 - (tIdx % 2),
            matchesTied: 1,
            winPercentage: 65,
            recentForm: ['W', 'W', 'L', 'W', 'W']
          },
          { upsert: true }
        );

        // Seed PlayerStat for key players
        for (const pid of teamPlayerIds.slice(0, 4)) {
          if (sportName === 'cricket') {
            await PlayerStat.findOneAndUpdate(
              { playerId: pid, sport: 'cricket' },
              {
                playerId: pid,
                sport: 'cricket',
                associationId: assoc._id,
                teamId: team._id,
                matches: 12 + tIdx,
                runsScored: 340 + tIdx * 25,
                highestScore: 88,
                centuries: 0,
                halfCenturies: 3,
                wicketsTaken: 8 + (tIdx % 5),
                bestBowling: '4/22',
                oversBowled: 28,
                maidens: 2,
                economyRate: 6.8
              },
              { upsert: true }
            );
          } else if (sportName === 'football') {
            await PlayerStat.findOneAndUpdate(
              { playerId: pid, sport: 'football' },
              {
                playerId: pid,
                sport: 'football',
                associationId: assoc._id,
                teamId: team._id,
                matches: 14 + tIdx,
                goals: 7 + (tIdx % 4),
                assists: 5 + (tIdx % 3),
                cleanSheets: tIdx % 2,
                yellowCards: 1,
                redCards: 0
              },
              { upsert: true }
            );
          } else if (sportName === 'basketball') {
            await PlayerStat.findOneAndUpdate(
              { playerId: pid, sport: 'basketball' },
              {
                playerId: pid,
                sport: 'basketball',
                associationId: assoc._id,
                teamId: team._id,
                matches: 15,
                points: 210 + tIdx * 15,
                assists: 45,
                rebounds: 38
              },
              { upsert: true }
            );
          }
        }

        // Team Chat Group
        let group = await Group.findOne({ refId: team._id });
        if (!group) {
          await Group.create({
            type: 'team',
            refId: team._id,
            name: `${team.name} Official Squad`,
            members: teamPlayerIds,
            adminIds: [cap._id, vc._id]
          });
        }

        seededSportTeams.push(team);
      }

      console.log(`✓ Successfully seeded ${seededSportTeams.length} complete teams for ${sportName} with 11 players each.`);
      return seededSportTeams;
    }

    // Seed 12 Cricket Teams (Team 0 captain is cc1@gmail.com, vc is vicecap@sports.com, player is player@sports.com)
    const cricketTeams = await seedTeamsForSport(
      'cricket',
      assocMap['cricket'],
      CRICKET_TEAMS_DATA,
      cc1Captain,
      viceCapUser,
      playerUser
    );

    // Seed 12 Football Teams
    const footballTeams = await seedTeamsForSport(
      'football',
      assocMap['football'],
      FOOTBALL_TEAMS_DATA,
      null,
      null,
      null
    );

    // Seed 12 Basketball Teams
    const basketballTeams = await seedTeamsForSport(
      'basketball',
      assocMap['basketball'],
      BASKETBALL_TEAMS_DATA,
      null,
      null,
      null
    );

    // 6. Tournaments & Registrations
    console.log('\n--- Seeding Tournaments, Fixtures & Live Matches ---');
    const cricketTourn = await Tournament.findOneAndUpdate(
      { name: 'National T20 Premier Trophy' },
      {
        name: 'National T20 Premier Trophy',
        sport: 'cricket',
        associationId: assocMap['cricket']._id,
        organizerId: organizerUser._id,
        status: 'ongoing',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 20),
        registrationDeadline: new Date(Date.now() - 86400000 * 2),
        format: 'knockout',
        maxTeams: 12,
        registrationFee: 3000,
        rules: 'ICC Standard T20 Regulations with Super Over.',
        prizeInfo: 'Champions: $10,000 + Gold Cup, Runners-up: $5,000',
        description: 'Premier national knockout tournament featuring top 12 franchises.'
      },
      { upsert: true, new: true }
    );

    // Register all 12 cricket teams
    for (const ct of cricketTeams) {
      await TournamentRegistration.findOneAndUpdate(
        { tournamentId: cricketTourn._id, teamId: ct._id },
        {
          tournamentId: cricketTourn._id,
          teamId: ct._id,
          status: 'approved',
          submittedBy: ct.captainId,
          verifiedBy: organizerUser._id,
          registrationFeeStatus: 'paid',
          rosterSnapshot: ct.players.map(pid => ({ userId: pid, name: 'Cricketer', role: 'player' }))
        },
        { upsert: true }
      );
    }
    console.log(`✓ Registered all ${cricketTeams.length} Cricket Teams for National T20 Trophy.`);

    const footballTourn = await Tournament.findOneAndUpdate(
      { name: 'Metropolitan Super League 2026' },
      {
        name: 'Metropolitan Super League 2026',
        sport: 'football',
        associationId: assocMap['football']._id,
        organizerId: organizerUser._id,
        status: 'ongoing',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 30),
        registrationDeadline: new Date(Date.now() - 86400000 * 3),
        format: 'round_robin',
        maxTeams: 12,
        registrationFee: 2500,
        rules: 'FIFA Standard 90 min. 3 points win, 1 draw.',
        prizeInfo: 'League Champions Shield & $12,000',
        description: 'Elite metropolitan round-robin championship with all 12 clubs.'
      },
      { upsert: true, new: true }
    );

    // Register all 12 football teams and create Standings
    for (const [idx, ft] of footballTeams.entries()) {
      await TournamentRegistration.findOneAndUpdate(
        { tournamentId: footballTourn._id, teamId: ft._id },
        {
          tournamentId: footballTourn._id,
          teamId: ft._id,
          status: 'approved',
          submittedBy: ft.captainId,
          verifiedBy: organizerUser._id,
          registrationFeeStatus: 'paid',
          rosterSnapshot: ft.players.map(pid => ({ userId: pid, name: 'Footballer', role: 'player' }))
        },
        { upsert: true }
      );

      await Standing.findOneAndUpdate(
        { tournamentId: footballTourn._id, teamId: ft._id },
        {
          tournamentId: footballTourn._id,
          teamId: ft._id,
          rank: idx + 1,
          played: 6,
          won: Math.max(0, 5 - Math.floor(idx / 2)),
          lost: Math.min(5, Math.floor(idx / 2)),
          tied: 1,
          points: (Math.max(0, 5 - Math.floor(idx / 2)) * 3) + 1,
          goalsFor: 14 - idx,
          goalsAgainst: 4 + idx,
          goalDifference: (10 - 2 * idx),
          streak: ['W', 'W', 'D']
        },
        { upsert: true }
      );
    }
    console.log(`✓ Registered all ${footballTeams.length} Football Teams & initialized League Standings.`);

    // 7. Fixtures & Matches
    // Create live Cricket Match between Team 0 (RCB, cc1) and Team 1 (CSK)
    const fix1 = await Fixture.findOneAndUpdate(
      { tournamentId: cricketTourn._id, round: 1, roundName: 'Quarter Final 1' },
      {
        tournamentId: cricketTourn._id,
        round: 1,
        roundName: 'Quarter Final 1',
        teamA: cricketTeams[0]._id,
        teamB: cricketTeams[1]._id,
        groundId: grounds[0]._id,
        scheduledDate: new Date(),
        scheduledTime: '15:30',
        status: 'scheduled'
      },
      { upsert: true, new: true }
    );

    const liveMatch = await Match.findOneAndUpdate(
      { fixtureId: fix1._id },
      {
        sport: 'cricket',
        type: 'tournament',
        fixtureId: fix1._id,
        refId: cricketTourn._id,
        tournamentId: cricketTourn._id,
        teamA: cricketTeams[0]._id,
        teamB: cricketTeams[1]._id,
        groundId: grounds[0]._id,
        associationId: assocMap['cricket']._id,
        status: 'live',
        tossWinner: cricketTeams[0]._id,
        tossDecision: 'bat',
        totalOvers: 20,
        startedAt: new Date(Date.now() - 3600000),
        scorerId: organizerUser._id,
        playingXI: {
          teamA: cricketTeams[0].players,
          teamB: cricketTeams[1].players
        },
        currentBatsmen: {
          strikerId: cricketTeams[0].players[0],
          nonStrikerId: cricketTeams[0].players[1]
        },
        currentBowlerId: cricketTeams[1].players[2],
        previousBowlerId: cricketTeams[1].players[3],
        currentInning: 1,
        innings: [
          {
            battingTeamId: cricketTeams[0]._id,
            bowlingTeamId: cricketTeams[1]._id,
            totalRuns: 142,
            wickets: 3,
            overs: 16.4,
            completed: false,
            extras: { wide: 4, noBall: 1, bye: 2, legBye: 2, total: 9 },
            fallOfWickets: [
              { wicket: 1, runs: 45, batsmanId: cricketTeams[0].players[2], over: 5.2 },
              { wicket: 2, runs: 88, batsmanId: cricketTeams[0].players[3], over: 10.4 },
              { wicket: 3, runs: 124, batsmanId: cricketTeams[0].players[4], over: 14.1 }
            ],
            balls: [
              { ballNum: 1, over: 16, runs: 4, isBoundary: true, batsmanId: cricketTeams[0].players[0], bowlerId: cricketTeams[1].players[2], commentary: 'Smashed through cover boundary for four!' },
              { ballNum: 2, over: 16, runs: 1, batsmanId: cricketTeams[0].players[0], bowlerId: cricketTeams[1].players[2], commentary: 'Easy single down to third man.' },
              { ballNum: 3, over: 16, runs: 6, isSix: true, batsmanId: cricketTeams[0].players[1], bowlerId: cricketTeams[1].players[2], commentary: 'Monster six high over long on!' },
              { ballNum: 4, over: 16, runs: 2, batsmanId: cricketTeams[0].players[1], bowlerId: cricketTeams[1].players[2], commentary: 'Quick double between wickets.' }
            ]
          }
        ]
      },
      { upsert: true, new: true }
    );

    // Completed Match between Team 2 (MI) and Team 3 (KKR)
    const fix2 = await Fixture.findOneAndUpdate(
      { tournamentId: cricketTourn._id, round: 1, roundName: 'Quarter Final 2' },
      {
        tournamentId: cricketTourn._id,
        round: 1,
        roundName: 'Quarter Final 2',
        teamA: cricketTeams[2]._id,
        teamB: cricketTeams[3]._id,
        groundId: grounds[1]._id,
        scheduledDate: new Date(Date.now() - 86400000),
        scheduledTime: '10:00',
        status: 'completed'
      },
      { upsert: true, new: true }
    );

    const completedCricketMatch = await Match.findOneAndUpdate(
      { fixtureId: fix2._id },
      {
        sport: 'cricket',
        type: 'tournament',
        fixtureId: fix2._id,
        refId: cricketTourn._id,
        tournamentId: cricketTourn._id,
        teamA: cricketTeams[2]._id,
        teamB: cricketTeams[3]._id,
        groundId: grounds[1]._id,
        associationId: assocMap['cricket']._id,
        status: 'completed',
        tossWinner: cricketTeams[2]._id,
        tossDecision: 'bat',
        totalOvers: 20,
        winnerId: cricketTeams[2]._id,
        resultSummary: `${cricketTeams[2].name} won by 24 runs`,
        startedAt: new Date(Date.now() - 86400000),
        endedAt: new Date(Date.now() - 86400000 + 10800000),
        playerOfMatchId: cricketTeams[2].players[0],
        playingXI: { teamA: cricketTeams[2].players, teamB: cricketTeams[3].players },
        innings: [
          { battingTeamId: cricketTeams[2]._id, bowlingTeamId: cricketTeams[3]._id, totalRuns: 178, wickets: 5, overs: 20, completed: true },
          { battingTeamId: cricketTeams[3]._id, bowlingTeamId: cricketTeams[2]._id, totalRuns: 154, wickets: 8, overs: 20, completed: true }
        ]
      },
      { upsert: true, new: true }
    );

    const res2 = await MatchResult.findOneAndUpdate(
      { matchId: completedCricketMatch._id },
      {
        matchId: completedCricketMatch._id,
        winnerTeamId: cricketTeams[2]._id,
        loserTeamId: cricketTeams[3]._id,
        resultType: 'win',
        marginText: 'by 24 runs',
        marginValue: 24,
        playerOfMatchId: cricketTeams[2].players[0],
        finalizedBy: organizerUser._id,
        inningsSummary: [
          { teamId: cricketTeams[2]._id, score: { totalRuns: 178, wickets: 5, overs: 20 } },
          { teamId: cricketTeams[3]._id, score: { totalRuns: 154, wickets: 8, overs: 20 } }
        ]
      },
      { upsert: true, new: true }
    );
    completedCricketMatch.resultId = res2._id;
    await completedCricketMatch.save();

    // Friendly Match
    await FriendlyMatch.findOneAndUpdate(
      { requestingTeamId: cricketTeams[0]._id, respondingTeamId: cricketTeams[4]._id },
      {
        requestingTeamId: cricketTeams[0]._id,
        respondingTeamId: cricketTeams[4]._id,
        sport: 'cricket',
        groundId: grounds[2]._id,
        date: new Date(Date.now() + 86400000 * 3),
        time: '14:00',
        status: 'accepted',
        createdBy: cricketTeams[0].captainId
      },
      { upsert: true }
    );

    // 8. Bookings & Fair Allocation
    await Booking.findOneAndUpdate(
      { groundId: grounds[0]._id, teamId: cricketTeams[0]._id },
      {
        groundId: grounds[0]._id,
        teamId: cricketTeams[0]._id,
        requestedBy: cricketTeams[0].captainId,
        date: new Date(Date.now() + 86400000 * 2),
        startTime: '10:00',
        endTime: '13:00',
        purpose: 'tournament',
        status: 'approved',
        fairScore: 88,
        scoreBreakdown: { hoursUsedScore: 30, daysSinceLastUsedScore: 30, shareScore: 20, tournamentBonus: 8 }
      },
      { upsert: true }
    );

    await Booking.findOneAndUpdate(
      { groundId: grounds[3]._id, teamId: footballTeams[0]._id },
      {
        groundId: grounds[3]._id,
        teamId: footballTeams[0]._id,
        requestedBy: footballTeams[0].captainId,
        date: new Date(Date.now() + 86400000 * 3),
        startTime: '16:00',
        endTime: '18:00',
        purpose: 'practice',
        status: 'pending',
        fairScore: 72,
        scoreBreakdown: { hoursUsedScore: 26, daysSinceLastUsedScore: 24, shareScore: 22, tournamentBonus: 0 }
      },
      { upsert: true }
    );

    // 9. Expenses & Funds
    await ExpenseRequest.findOneAndUpdate(
      { purpose: 'International stadium outfield grass seeds and heavy turf roller' },
      {
        associationId: assocMap['cricket']._id,
        requestedBy: groundOfficerUser._id,
        purpose: 'International stadium outfield grass seeds and heavy turf roller',
        category: 'ground_maintenance',
        amount: 8500,
        status: 'approved',
        approvedBy: headUser._id,
        approvedAt: new Date(Date.now() - 86400000)
      },
      { upsert: true }
    );

    await Fund.findOneAndUpdate(
      { description: 'National T20 Tournament Title Sponsorship 2026' },
      {
        associationId: assocMap['cricket']._id,
        type: 'income',
        category: 'sponsorship',
        amount: 75000,
        description: 'National T20 Tournament Title Sponsorship 2026',
        status: 'completed',
        requestedBy: headUser._id,
        receiptStatus: 'generated'
      },
      { upsert: true }
    );

    const totalTeams = await Team.countDocuments();
    const totalUsers = await User.countDocuments();
    const cricketCount = await Team.countDocuments({ sport: 'cricket' });
    const footballCount = await Team.countDocuments({ sport: 'football' });
    const basketballCount = await Team.countDocuments({ sport: 'basketball' });

    console.log('\n======================================================');
    console.log('✓ LARGE DATASET SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log(`Total Teams: ${totalTeams}`);
    console.log(`- Cricket Teams: ${cricketCount} (11 players per team)`);
    console.log(`- Football Teams: ${footballCount} (11 players per team)`);
    console.log(`- Basketball Teams: ${basketballCount} (11 players per team)`);
    console.log(`Total Users in System: ${totalUsers}`);
    console.log('\nLogin Accounts for ALL 8 Roles (Password: password123):');
    console.log('1. System Admin:           admin@sports.com');
    console.log('2. Association Head:       head@sports.com');
    console.log('3. Tournament Organizer:   organizer@sports.com');
    console.log('4. Ground Officer:         ground@sports.com');
    console.log('5. Funds Officer:          funds@sports.com');
    console.log('6. Team Captain:           cc1@gmail.com (Captain of RCB XI)');
    console.log('7. Vice Captain:           vicecap@sports.com (Vice Captain of RCB XI)');
    console.log('8. Player:                 player@sports.com (Player of RCB XI)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Failed to seed large dataset:', err);
    process.exit(1);
  }
}

seedLargeDataset();
