const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Backfill: Remove explicit null username values to preserve sparse unique index
    const nullUsernames = await User.countDocuments({ username: null });
    if (nullUsernames > 0) {
      await User.updateMany({ username: null }, { $unset: { username: 1 } });
    }
    if (process.env.NODE_ENV === 'production') {
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;

      if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be provided in production.');
        return;
      }
      if (password.length < 8 || password === 'password123' || password.toLowerCase().includes('admin')) {
        console.error('Weak ADMIN_PASSWORD provided. Refusing to seed admin.');
        return;
      }

      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        await User.create({
          name: 'System Admin',
          email,
          passwordHash: password,
          role: 'admin',
          status: 'active',
        });
        console.log('Production admin user created successfully.');
      }
    } else {
      console.warn('WARNING: Running in development mode. Seeding test accounts with default passwords.');
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        await User.create([
          {
            name: 'System Admin',
            email: 'admin@sports.com',
            passwordHash: 'password123',
            role: 'admin',
            phone: '1234567890',
            status: 'active',
          },
          {
            name: 'Association Head',
            email: 'head@sports.com',
            passwordHash: 'password123',
            role: 'association_head',
            status: 'active',
          },
          {
            name: 'Tournament Organizer',
            email: 'organizer@sports.com',
            passwordHash: 'password123',
            role: 'tournament_organizer',
            status: 'active',
          },
          {
            name: 'Team Captain (cc1)',
            email: 'cc1@gmail.com',
            passwordHash: 'password123',
            role: 'captain',
            status: 'active',
          },
          {
            name: 'Vice Captain',
            email: 'vicecap@sports.com',
            passwordHash: 'password123',
            role: 'vice_captain',
            status: 'active',
          },
          {
            name: 'Ground Officer',
            email: 'ground@sports.com',
            passwordHash: 'password123',
            role: 'ground_officer',
            status: 'active',
          },
          {
            name: 'Funds Officer',
            email: 'funds@sports.com',
            passwordHash: 'password123',
            role: 'funds_officer',
            status: 'active',
          },
          {
            name: 'Regular Player',
            email: 'player@sports.com',
            passwordHash: 'password123',
            role: 'player',
            status: 'active',
          }
        ]);
        console.log('All 8 role users created successfully.');
      }
    }

    // Seed default sports master list if none exist
    const Sport = require('../models/Sport');
    const sportsCount = await Sport.countDocuments();
    if (sportsCount === 0) {
      const defaultSports = [
        {
          name: 'Cricket',
          icon: '🏏',
          isActive: true,
          scoringSchema: {
            rules: 'ICC Standard limited overs rules (T20/ODI/Test). Runs, wickets, balls, overs.',
            fields: [
              { key: 'runs', label: 'Runs', type: 'number', required: true },
              { key: 'wickets', label: 'Wickets', type: 'number', required: true },
              { key: 'overs', label: 'Overs', type: 'number', required: true },
            ]
          }
        },
        {
          name: 'Football',
          icon: '⚽',
          isActive: true,
          scoringSchema: {
            rules: 'FIFA 90-minute association football match. Goals, fouls, cards.',
            fields: [
              { key: 'goals', label: 'Goals', type: 'number', required: true },
              { key: 'shots', label: 'Shots on Target', type: 'number', required: false },
              { key: 'fouls', label: 'Fouls', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Basketball',
          icon: '🏀',
          isActive: true,
          scoringSchema: {
            rules: 'FIBA/NBA 4-quarter basketball game. Points, rebounds, assists.',
            fields: [
              { key: 'points', label: 'Points', type: 'number', required: true },
              { key: 'rebounds', label: 'Rebounds', type: 'number', required: false },
              { key: 'assists', label: 'Assists', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Volleyball',
          icon: '🏐',
          isActive: true,
          scoringSchema: {
            rules: 'Best of 3 or 5 sets to 25 points, deciding set to 15 points.',
            fields: [
              { key: 'sets', label: 'Sets Won', type: 'number', required: true },
              { key: 'aces', label: 'Aces', type: 'number', required: false },
              { key: 'blocks', label: 'Blocks', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Tennis',
          icon: '🎾',
          isActive: true,
          scoringSchema: {
            rules: 'ITF rules. Best of 3 sets with games and tiebreak.',
            fields: [
              { key: 'sets', label: 'Sets Won', type: 'number', required: true },
              { key: 'games', label: 'Games Won', type: 'number', required: false },
              { key: 'aces', label: 'Aces', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Badminton',
          icon: '🏸',
          isActive: true,
          scoringSchema: {
            rules: 'BWF 3x21 rally point scoring system.',
            fields: [
              { key: 'sets', label: 'Sets Won', type: 'number', required: true },
              { key: 'smashPoints', label: 'Smash Winners', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Table Tennis',
          icon: '🏓',
          isActive: true,
          scoringSchema: {
            rules: 'ITTF best of 5 or 7 games to 11 points.',
            fields: [
              { key: 'games', label: 'Games Won', type: 'number', required: true },
              { key: 'points', label: 'Total Points', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Hockey',
          icon: '🏑',
          isActive: true,
          scoringSchema: {
            rules: 'FIH 4 quarters of 15 minutes. Goals and penalty corners.',
            fields: [
              { key: 'goals', label: 'Goals', type: 'number', required: true },
              { key: 'penaltyCorners', label: 'Penalty Corners', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Baseball',
          icon: '⚾',
          isActive: true,
          scoringSchema: {
            rules: '9 innings of baseball. Runs, hits, errors.',
            fields: [
              { key: 'runs', label: 'Runs', type: 'number', required: true },
              { key: 'hits', label: 'Hits', type: 'number', required: false },
              { key: 'homeRuns', label: 'Home Runs', type: 'number', required: false },
            ]
          }
        },
        {
          name: 'Rugby',
          icon: '🏉',
          isActive: true,
          scoringSchema: {
            rules: 'World Rugby rules. Tries (5), Conversions (2), Penalties (3).',
            fields: [
              { key: 'tries', label: 'Tries', type: 'number', required: true },
              { key: 'totalPoints', label: 'Total Points', type: 'number', required: true },
            ]
          }
        },
        {
          name: 'Swimming',
          icon: '🏊',
          isActive: true,
          scoringSchema: {
            rules: 'Timed heats and finals across strokes and distances.',
            fields: [
              { key: 'lapTime', label: 'Time (Seconds)', type: 'number', required: true },
              { key: 'rank', label: 'Finishing Rank', type: 'number', required: true },
            ]
          }
        },
        {
          name: 'Athletics',
          icon: '🏃',
          isActive: true,
          scoringSchema: {
            rules: 'Track and field competition timings and distances.',
            fields: [
              { key: 'points', label: 'Event Points', type: 'number', required: true },
              { key: 'position', label: 'Finish Position', type: 'number', required: true },
            ]
          }
        }
      ];

      await Sport.insertMany(defaultSports);
      console.log(`Seeded ${defaultSports.length} default sports.`);
    }
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
  }
};

// Allow running directly from command line
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sports-platform')
    .then(async () => {
      await seedAdmin();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedAdmin;
