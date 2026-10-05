const mongoose = require('mongoose');
const Group = require('../models/Group');
const Team = require('../models/Team');
const User = require('../models/User');

/**
 * Repairs association group memberships
 * Ensures only Association Heads, Officers, and Team Captains are members.
 * Non-captain players are removed from association groups.
 */
async function repairAssociationGroups() {
  try {
    const associationGroups = await Group.find({ type: 'association' });
    console.log(`Auditing ${associationGroups.length} association group(s)...`);

    for (const group of associationGroups) {
      const assocId = group.refId;
      // Get all approved team captains for this association
      const teams = await Team.find({ associationId: assocId, status: 'approved' });
      const validCaptainIds = teams.map(t => t.captainId.toString());

      // Get association officers / head
      const officers = await User.find({
        associationId: assocId,
        role: { $in: ['association_head', 'tournament_organizer', 'ground_officer', 'funds_officer', 'admin'] }
      });
      const validOfficerIds = officers.map(o => o._id.toString());

      const allowedIds = new Set([...validCaptainIds, ...validOfficerIds]);

      // Filter members
      const initialCount = group.members.length;
      group.members = group.members.filter(m => allowedIds.has(m.toString()));

      if (group.members.length !== initialCount) {
        await group.save();
        console.log(`Repaired group "${group.name}": reduced from ${initialCount} to ${group.members.length} members.`);
      }
    }
    console.log('Association group repair completed.');
  } catch (err) {
    console.error('Error repairing association groups:', err);
  }
}

if (require.main === module) {
  require('dotenv').config();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_association';
  mongoose.connect(uri).then(async () => {
    await repairAssociationGroups();
    process.exit(0);
  });
}

module.exports = repairAssociationGroups;
