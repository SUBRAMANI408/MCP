const mongoose = require('mongoose');

// Models
const Association = require('../models/Association');
const Team = require('../models/Team');
const Ground = require('../models/Ground');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const FriendlyMatch = require('../models/FriendlyMatch');
const Booking = require('../models/Booking');
const Fund = require('../models/Fund');

async function populateDashboardData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/');
    console.log('Connected to DB');

    const assoc = await Association.findOne({ name: '[TEMP] National Ultimate League' });
    const team = await Team.findOne({ name: '[TEMP] Flying Eagles' });
    const ground = await Ground.findOne({ name: '[TEMP] Main Stadium' });
    const admin = await User.findOne({ role: 'admin' });
    
    if (!assoc || !team || !ground || !admin) {
      console.log('Base temp data not found, please run createTestDataFull.js first');
      process.exit(1);
    }

    // 1. Create another team for matches
    let team2 = await Team.findOne({ name: '[TEMP] Rival Squad' });
    if (!team2) {
      team2 = await Team.create({
        name: '[TEMP] Rival Squad',
        sport: '[TEMP] Competitive Basketball',
        associationId: assoc._id,
        captainId: admin._id,
        status: 'approved',
        players: [admin._id]
      });
      console.log('Created Rival Team');
    }

    // 2. Create Tournament
    const tournament = await Tournament.create({
      name: '[TEMP] Summer Championship',
      sport: '[TEMP] Competitive Basketball',
      associationId: assoc._id,
      organizerId: admin._id,
      status: 'ongoing',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 10),
      format: 'knockout',
      maxTeams: 8,
      description: 'Temp tournament for testing dashboard.'
    });
    console.log('Created Tournament');

    // 3. Create Matches (Live, Scheduled, Completed)
    await Match.create([
      {
        tournamentId: tournament._id,
        refId: tournament._id,
        sport: '[TEMP] Competitive Basketball',
        teamA: team._id,
        teamB: team2._id,
        groundId: ground._id,
        date: new Date(),
        time: '14:00',
        status: 'live',
        type: 'tournament',
        scoreA: 2,
        scoreB: 1
      },
      {
        tournamentId: tournament._id,
        refId: tournament._id,
        sport: '[TEMP] Competitive Basketball',
        teamA: team._id,
        teamB: team2._id,
        groundId: ground._id,
        date: new Date(Date.now() + 86400000 * 2), // 2 days future
        time: '18:00',
        status: 'scheduled',
        type: 'tournament'
      },
      {
        tournamentId: tournament._id,
        refId: tournament._id,
        sport: '[TEMP] Competitive Basketball',
        teamA: team._id,
        teamB: team2._id,
        groundId: ground._id,
        date: new Date(Date.now() - 86400000 * 2), // 2 days past
        time: '10:00',
        status: 'completed',
        type: 'tournament',
        scoreA: 5,
        scoreB: 3,
        winnerId: team._id
      }
    ]);
    console.log('Created Matches (Live, Scheduled, Completed)');

    // 4. Create Friendly Match
    await FriendlyMatch.create({
      requestingTeamId: team._id,
      respondingTeamId: team2._id,
      sport: '[TEMP] Competitive Basketball',
      groundId: ground._id,
      date: new Date(),
      time: '16:00',
      status: 'accepted'
    });
    console.log('Created Friendly Match');

    // 5. Create Booking
    await Booking.create({
      groundId: ground._id,
      teamId: team._id,
      requestedBy: admin._id,
      date: new Date(Date.now() + 86400000 * 3),
      startTime: '09:00',
      endTime: '11:00',
      purpose: 'practice',
      status: 'approved'
    });
    console.log('Created Booking');

    // 6. Create Funds (Revenue / Expense)
    await Fund.create([
      {
        associationId: assoc._id,
        amount: 25000,
        type: 'income',
        category: 'tournament_fee',
        status: 'completed',
        description: 'Entry fees from Summer Championship',
        recordedBy: admin._id,
        requestedBy: admin._id,
        date: new Date()
      },
      {
        associationId: assoc._id,
        amount: 5000,
        type: 'expense',
        category: 'expense',
        status: 'approved',
        description: 'Ground maintenance and net repairs',
        recordedBy: admin._id,
        requestedBy: admin._id,
        date: new Date()
      }
    ]);
    console.log('Created Financial Telemetry Data');

    console.log('Dashboard Data Population Complete!');
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

populateDashboardData();
