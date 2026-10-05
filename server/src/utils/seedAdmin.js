const User = require('../models/User');

const seedAdmin = async () => {
  try {
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
