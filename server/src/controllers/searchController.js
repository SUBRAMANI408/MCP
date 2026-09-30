const User = require('../models/User');
const Team = require('../models/Team');
const Ground = require('../models/Ground');
const Tournament = require('../models/Tournament');
const Association = require('../models/Association');
const { successResponse } = require('../utils/apiResponse');

exports.globalSearch = async (req, res) => {
  const { q, type, sport, role, status, associationId, limit = 10 } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ success: false, message: 'Search query required' });
  }

  const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = { $regex: escapedQ, $options: 'i' };
  const lim = Math.min(Number(limit), 50);

  const results = {};

  const searches = [];

  if (!type || type === 'users') {
    const userQuery = {
      $or: [{ name: regex }, { email: regex }],
    };
    if (role) userQuery.role = role;
    if (associationId) userQuery.associationId = associationId;
    searches.push(
      User.find(userQuery).select('name email role avatar teamId associationId').limit(lim)
        .then(data => { results.users = data; })
    );
  }

  if (!type || type === 'teams') {
    const teamQuery = { $or: [{ name: regex }, { sport: regex }] };
    if (sport) teamQuery.sport = sport;
    if (status) teamQuery.status = status;
    if (associationId) teamQuery.associationId = associationId;
    searches.push(
      Team.find(teamQuery).select('name sport status logo matchesPlayed').populate('captainId', 'name').limit(lim)
        .then(data => { results.teams = data; })
    );
  }

  if (!type || type === 'grounds') {
    const groundQuery = { $or: [{ name: regex }, { location: regex }] };
    if (sport) groundQuery.sportsSupported = sport;
    if (associationId) groundQuery.associationId = associationId;
    searches.push(
      Ground.find(groundQuery).select('name location sportsSupported status capacity').limit(lim)
        .then(data => { results.grounds = data; })
    );
  }

  if (!type || type === 'tournaments') {
    const tourQuery = { $or: [{ name: regex }, { description: regex }] };
    if (sport) tourQuery.sport = sport;
    if (status) tourQuery.status = status;
    if (associationId) tourQuery.associationId = associationId;
    searches.push(
      Tournament.find(tourQuery).select('name sport status format startDate endDate')
        .populate('associationId', 'name').limit(lim)
        .then(data => { results.tournaments = data; })
    );
  }

  if (!type || type === 'associations') {
    searches.push(
      Association.find({ name: regex }).select('name address description contactInfo').limit(lim)
        .then(data => { results.associations = data; })
    );
  }

  await Promise.all(searches);

  successResponse(res, results);
};
