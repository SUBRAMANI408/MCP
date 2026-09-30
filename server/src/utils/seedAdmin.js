const User = require('../models/User');

const seedAdmin = async () => {
  try {
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
      console.log('Password for all test accounts is: password123');
    }
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
  }
};

module.exports = seedAdmin;
