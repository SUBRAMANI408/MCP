require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Team = require('./src/models/Team');
const Association = require('./src/models/Association');
const Group = require('./src/models/Group');

const runSeeding = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sap';
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // 1. First, create the users so we can get an association head ID
    const dummyHeadId = new mongoose.Types.ObjectId();

    // 2. Create the Cricket Association (headUserId is required)
    let association = await Association.findOne({ name: 'Cricket Sports Association' });
    if (!association) {
      association = await Association.create({
        name: 'Cricket Sports Association',
        description: 'Governing body for local cricket clubs and tournaments',
        sportsSupported: ['cricket'],
        headUserId: dummyHeadId,
        status: 'active',
      });
      console.log('Association created:', association.name);
    }

    // 3. Create logins for each role
    const usersToCreate = [
      { name: 'Cricket Head', email: 'head@cricket.com', role: 'association_head', associationId: association._id },
      { name: 'Cricket Organizer', email: 'organizer@cricket.com', role: 'tournament_organizer', associationId: association._id },
      { name: 'Cricket Ground Officer', email: 'ground@cricket.com', role: 'ground_officer', associationId: association._id },
      { name: 'Cricket Funds Officer', email: 'funds@cricket.com', role: 'funds_officer', associationId: association._id },
      { name: 'Captain A', email: 'captainA@cricket.com', role: 'captain', associationId: association._id },
      { name: 'Captain B', email: 'captainB@cricket.com', role: 'captain', associationId: association._id },
    ];

    const seededUsers = {};
    for (const u of usersToCreate) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create({
          name: u.name,
          email: u.email,
          passwordHash: 'Password123',
          role: u.role,
          associationId: u.associationId,
          status: 'active',
        });
        console.log(`User created: ${u.name} (${u.role}) - Login with: ${u.email} / Password123`);
      } else {
        console.log(`User already exists: ${u.name} (${u.role})`);
      }
      seededUsers[u.role + '_' + u.name.split(' ').pop()] = user;
    }

    // Update the Association headUserId to match the real Cricket Head ID
    const realHead = seededUsers['association_head_Head'];
    if (realHead && (association.headUserId.toString() === dummyHeadId.toString())) {
      association.headUserId = realHead._id;
      await association.save();
      console.log('Updated association headUserId to:', realHead.name);
    }

    // 4. Setup Team A and Team B
    const captainA = seededUsers['captain_A'];
    const captainB = seededUsers['captain_B'];

    let teamA = await Team.findOne({ captainId: captainA._id });
    if (!teamA) {
      teamA = await Team.create({
        name: 'Strikers XI',
        sport: 'cricket',
        associationId: association._id,
        captainId: captainA._id,
        players: [captainA._id],
        status: 'approved',
      });
      await User.findByIdAndUpdate(captainA._id, { teamId: teamA._id });
      console.log('Team A created: Strikers XI');
    }

    let teamB = await Team.findOne({ captainId: captainB._id });
    if (!teamB) {
      teamB = await Team.create({
        name: 'Warriors XI',
        sport: 'cricket',
        associationId: association._id,
        captainId: captainB._id,
        players: [captainB._id],
        status: 'approved',
      });
      await User.findByIdAndUpdate(captainB._id, { teamId: teamB._id });
      console.log('Team B created: Warriors XI');
    }

    // 5. Create and populate team groups
    let groupA = await Group.findOne({ refId: teamA._id });
    if (!groupA) {
      groupA = await Group.create({
        type: 'team',
        refId: teamA._id,
        name: `${teamA.name} Group`,
        members: [captainA._id],
        adminIds: [captainA._id],
      });
      console.log('Group Chat for Team A initialized.');
    }

    let groupB = await Group.findOne({ refId: teamB._id });
    if (!groupB) {
      groupB = await Group.create({
        type: 'team',
        refId: teamB._id,
        name: `${teamB.name} Group`,
        members: [captainB._id],
        adminIds: [captainB._id],
      });
      console.log('Group Chat for Team B initialized.');
    }

    // 6. Seed and assign players for Team A and Team B
    const playersTeamA = [
      { name: 'A Player 1', email: 'aplayer1@cricket.com' },
      { name: 'A Player 2', email: 'aplayer2@cricket.com' },
      { name: 'A Player 3', email: 'aplayer3@cricket.com' },
      { name: 'A Player 4', email: 'aplayer4@cricket.com' },
      { name: 'A Player 5', email: 'aplayer5@cricket.com' },
    ];

    const playersTeamB = [
      { name: 'B Player 1', email: 'bplayer1@cricket.com' },
      { name: 'B Player 2', email: 'bplayer2@cricket.com' },
      { name: 'B Player 3', email: 'bplayer3@cricket.com' },
      { name: 'B Player 4', email: 'bplayer4@cricket.com' },
      { name: 'B Player 5', email: 'bplayer5@cricket.com' },
    ];

    const teamAPlayerIds = [captainA._id];
    for (const p of playersTeamA) {
      let player = await User.findOne({ email: p.email });
      if (!player) {
        player = await User.create({
          name: p.name,
          email: p.email,
          passwordHash: 'Password123',
          role: 'player',
          associationId: association._id,
          teamId: teamA._id,
          status: 'active',
        });
        console.log(`Player created for Team A: ${p.name} (${p.email})`);
      }
      teamAPlayerIds.push(player._id);
    }
    // Update team roster and members
    teamA.players = teamAPlayerIds;
    await teamA.save();
    await Group.findOneAndUpdate({ refId: teamA._id }, { $addToSet: { members: { $each: teamAPlayerIds } } });

    const teamBPlayerIds = [captainB._id];
    for (const p of playersTeamB) {
      let player = await User.findOne({ email: p.email });
      if (!player) {
        player = await User.create({
          name: p.name,
          email: p.email,
          passwordHash: 'Password123',
          role: 'player',
          associationId: association._id,
          teamId: teamB._id,
          status: 'active',
        });
        console.log(`Player created for Team B: ${p.name} (${p.email})`);
      }
      teamBPlayerIds.push(player._id);
    }
    // Update team roster and members
    teamB.players = teamBPlayerIds;
    await teamB.save();
    await Group.findOneAndUpdate({ refId: teamB._id }, { $addToSet: { members: { $each: teamBPlayerIds } } });

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding encountered an error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runSeeding();
