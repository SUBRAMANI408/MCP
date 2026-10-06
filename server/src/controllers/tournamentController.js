const Tournament = require('../models/Tournament');
const Fixture = require('../models/Fixture');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { generateRoundRobin, generateKnockout } = require('../utils/fixtureGenerator');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

exports.createTournament = async (req, res) => {
  const { name, sport, associationId, registrationStartDate, registrationDeadline, startDate, endDate, format, maxTeams, description, registrationFee, rules, prizeInfo, prizeDetails, contactInfo, banner } = req.body;
  const tournament = await Tournament.create({
    name, sport, associationId,
    organizerId: req.user._id,
    registrationStartDate, registrationDeadline, startDate, endDate,
    format: format || 'round_robin',
    maxTeams: maxTeams || 16,
    description,
    registrationFee: registrationFee || 0,
    rules,
    prizeInfo: prizeInfo || prizeDetails,
    contactInfo,
    banner,
    status: 'draft',
  });
  successResponse(res, tournament, 'Tournament created', 201);
};

exports.getTournaments = async (req, res) => {
  const { associationId, status, sport, page = 1, limit = 10 } = req.query;
  const query = {};
  if (associationId) query.associationId = associationId;
  if (status) query.status = status;
  if (sport) query.sport = sport;
  const total = await Tournament.countDocuments(query);
  const tournaments = await Tournament.find(query)
    .populate('organizerId', 'name')
    .populate('associationId', 'name')
    .skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
  paginatedResponse(res, tournaments, { total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getTournament = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id)
    .populate('organizerId', 'name email')
    .populate('associationId', 'name')
    .populate('registeredTeams', 'name sport captainId matchesPlayed')
    .populate('approvedBy', 'name');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  successResponse(res, tournament);
};

exports.updateTournament = async (req, res) => {
  const { name, sport, associationId, registrationStartDate, registrationDeadline, startDate, endDate, format, maxTeams, description, registrationFee, rules, prizeInfo, prizeDetails, contactInfo, banner, status } = req.body;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (sport !== undefined) updateData.sport = sport;
  if (associationId !== undefined) updateData.associationId = associationId;
  if (registrationStartDate !== undefined) updateData.registrationStartDate = registrationStartDate;
  if (registrationDeadline !== undefined) updateData.registrationDeadline = registrationDeadline;
  if (startDate !== undefined) updateData.startDate = startDate;
  if (endDate !== undefined) updateData.endDate = endDate;
  if (format !== undefined) updateData.format = format;
  if (maxTeams !== undefined) updateData.maxTeams = maxTeams;
  if (description !== undefined) updateData.description = description;
  if (registrationFee !== undefined) updateData.registrationFee = registrationFee;
  if (rules !== undefined) updateData.rules = rules;
  if (prizeInfo !== undefined || prizeDetails !== undefined) updateData.prizeInfo = prizeInfo || prizeDetails;
  if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
  if (banner !== undefined) updateData.banner = banner;
  if (status !== undefined) updateData.status = status;

  const tournament = await Tournament.findByIdAndUpdate(req.params.id, updateData, { new: true });
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  successResponse(res, tournament, 'Tournament updated');
};

exports.submitForApproval = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.organizerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  tournament.status = 'pending_approval';
  await tournament.save();
  const io = req.app.get('io');
  io.to(tournament.associationId.toString()).emit('tournament:statusChange', { status: 'pending_approval', tournamentId: tournament._id });
  successResponse(res, tournament, 'Tournament submitted for approval');
};

exports.approveTournament = async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approvedBy: req.user._id },
    { new: true }
  );
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  await Notification.create({
    userId: tournament.organizerId,
    type: 'tournament_approved',
    message: `Tournament "${tournament.name}" has been approved!`,
    refId: tournament._id,
  });
  const io = req.app.get('io');
  io.to(tournament.organizerId.toString()).emit('notification:new', { type: 'tournament_approved' });
  successResponse(res, tournament, 'Tournament approved');
};

exports.rejectTournament = async (req, res) => {
  const { reason } = req.body;
  const tournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    { status: 'draft' },
    { new: true }
  );
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  await Notification.create({
    userId: tournament.organizerId,
    type: 'tournament_rejected',
    message: `Tournament "${tournament.name}" was rejected. ${reason || ''}`,
    refId: tournament._id,
  });
  successResponse(res, tournament, 'Tournament rejected');
};

exports.registerTeam = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id);
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.status !== 'approved') return res.status(400).json({ success: false, message: 'Tournament not open for registration' });
  
  const now = new Date();
  if (tournament.registrationStartDate && now < new Date(tournament.registrationStartDate)) {
    return res.status(400).json({ success: false, message: 'Registration has not started yet' });
  }
  if (tournament.registrationDeadline && now > new Date(tournament.registrationDeadline)) {
    return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
  }

  if (tournament.registeredTeams.length >= tournament.maxTeams) {
    return res.status(400).json({ success: false, message: 'Tournament is full' });
  }
  const teamId = req.user.teamId;
  if (!teamId) return res.status(400).json({ success: false, message: 'You are not in a team' });
  if (tournament.registeredTeams.map(t => t.toString()).includes(teamId.toString())) {
    return res.status(400).json({ success: false, message: 'Team already registered' });
  }

  const TournamentRegistration = require('../models/TournamentRegistration');
  const Team = require('../models/Team');
  const team = await Team.findById(teamId).populate('players', 'name role email');
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  if (req.user.role !== 'admin') {
    const userAssocId = req.user.associationId?._id ? req.user.associationId._id.toString() : req.user.associationId?.toString();
    const teamAssocId = team.associationId?._id ? team.associationId._id.toString() : team.associationId?.toString();
    const tourAssocId = tournament.associationId?._id ? tournament.associationId._id.toString() : tournament.associationId?.toString();
    if (tourAssocId && (userAssocId !== tourAssocId || teamAssocId !== tourAssocId)) {
      return res.status(403).json({ success: false, message: 'Cross-association tournament registration is forbidden' });
    }
  }

  const rosterSnapshot = (team?.players || []).map(p => ({
    userId: p._id,
    name: p.name,
    role: p.role,
  }));

  const feeRequired = (tournament.registrationFee || 0) > 0;

  const registration = await TournamentRegistration.findOneAndUpdate(
    { tournamentId: tournament._id, teamId },
    {
      tournamentId: tournament._id,
      teamId,
      submittedBy: req.user._id,
      status: 'pending',
      registrationFeeStatus: feeRequired ? 'unpaid' : 'exempt',
      rosterSnapshot,
    },
    { upsert: true, new: true }
  );

  tournament.registeredTeams.push(teamId);
  await tournament.save();
  successResponse(res, { tournament, registration }, 'Team registration submitted');
};

exports.unregisterTeam = async (req, res) => {
  const TournamentRegistration = require('../models/TournamentRegistration');
  await TournamentRegistration.findOneAndUpdate(
    { tournamentId: req.params.id, teamId: req.user.teamId },
    { status: 'withdrawn' }
  );

  const tournament = await Tournament.findByIdAndUpdate(
    req.params.id,
    { $pull: { registeredTeams: req.user.teamId } },
    { new: true }
  );
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  successResponse(res, tournament, 'Team unregistered');
};

exports.getTournamentRegistrations = async (req, res) => {
  const TournamentRegistration = require('../models/TournamentRegistration');
  const registrations = await TournamentRegistration.find({ tournamentId: req.params.id })
    .populate('teamId', 'name sport logo captainId')
    .populate('submittedBy', 'name email phone')
    .sort({ createdAt: -1 });
  successResponse(res, registrations);
};

exports.reviewTournamentRegistration = async (req, res) => {
  const { status, rejectionReason } = req.body;
  const TournamentRegistration = require('../models/TournamentRegistration');
  const registration = await TournamentRegistration.findById(req.params.regId);
  if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });

  registration.status = status;
  registration.verifiedBy = req.user._id;
  if (rejectionReason) registration.rejectionReason = rejectionReason;
  await registration.save();

  if (status === 'approved') {
    await Tournament.findByIdAndUpdate(registration.tournamentId, {
      $addToSet: { registeredTeams: registration.teamId }
    });
  } else if (status === 'rejected') {
    await Tournament.findByIdAndUpdate(registration.tournamentId, {
      $pull: { registeredTeams: registration.teamId }
    });
  }

  successResponse(res, registration, `Registration ${status}`);
};

exports.generateFixtures = async (req, res) => {
  const tournament = await Tournament.findById(req.params.id).populate('registeredTeams', '_id name');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  if (tournament.registeredTeams.length < 2) {
    return res.status(400).json({ success: false, message: 'Need at least 2 teams to generate fixtures' });
  }
  // Delete existing fixtures
  await Fixture.deleteMany({ tournamentId: tournament._id });
  
  const { generateRoundRobin, generateKnockout, generateGroupKnockout } = require('../utils/fixtureGenerator');
  let fixtureData;
  if (tournament.format === 'knockout') {
    fixtureData = generateKnockout(tournament.registeredTeams, tournament._id);
  } else if (tournament.format === 'group_knockout') {
    fixtureData = generateGroupKnockout(tournament.registeredTeams, tournament._id);
  } else {
    fixtureData = generateRoundRobin(tournament.registeredTeams, tournament._id);
  }
  const fixtures = await Fixture.insertMany(fixtureData);
  successResponse(res, fixtures, 'Fixtures generated', 201);
};

exports.startTournament = async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, { status: 'ongoing' }, { new: true });
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  successResponse(res, tournament, 'Tournament started');
};

exports.completeTournament = async (req, res) => {
  const tournament = await Tournament.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
  successResponse(res, tournament, 'Tournament completed');
};

exports.getTournamentReports = async (req, res) => {
  const { id } = req.params;
  const [tournament, fixtures, totalTeams] = await Promise.all([
    Tournament.findById(id).populate('registeredTeams', 'name matchesPlayed'),
    Fixture.find({ tournamentId: id }).populate('teamA teamB', 'name'),
    Tournament.findById(id).select('registeredTeams'),
  ]);
  const completedFixtures = fixtures.filter(f => f.status === 'completed').length;
  const scheduledFixtures = fixtures.filter(f => f.status === 'scheduled').length;
  successResponse(res, { tournament, fixtures, completedFixtures, scheduledFixtures, totalTeams: tournament?.registeredTeams?.length || 0 });
};

exports.getTournamentOrganizerDashboard = async (req, res) => {
  const organizerId = req.user._id;

  const tournaments = await Tournament.find({ organizerId }, '_id name status registeredTeams');
  const tournamentIds = tournaments.map(t => t._id);

  const [
    totalTournaments, upcoming, ongoing, completed,
    totalMatches, upcomingMatches, liveMatches, completedMatches
  ] = await Promise.all([
    Tournament.countDocuments({ organizerId }),
    Tournament.countDocuments({ organizerId, status: 'approved' }),
    Tournament.countDocuments({ organizerId, status: 'ongoing' }),
    Tournament.countDocuments({ organizerId, status: 'completed' }),
    Fixture.countDocuments({ tournamentId: { $in: tournamentIds } }),
    Fixture.countDocuments({ tournamentId: { $in: tournamentIds }, status: 'scheduled' }),
    Fixture.countDocuments({ tournamentId: { $in: tournamentIds }, status: 'live' }),
    Fixture.countDocuments({ tournamentId: { $in: tournamentIds }, status: 'completed' })
  ]);

  const totalRegisteredTeams = tournaments.reduce((acc, t) => acc + (t.registeredTeams?.length || 0), 0);

  successResponse(res, {
    totalTournaments,
    upcoming,
    ongoing,
    completed,
    totalRegisteredTeams,
    totalMatches,
    upcomingMatches,
    liveMatches,
    completedMatches
  });
};

const Standing = require('../models/Standing');

exports.getTournamentStandings = async (req, res) => {
  const { id } = req.params;
  const tournament = await Tournament.findById(id).populate('registeredTeams', 'name sport logo');
  if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

  let standings = await Standing.find({ tournamentId: id })
    .populate('teamId', 'name sport logo captainId')
    .sort({ points: -1, netRunRate: -1, goalDifference: -1 });

  if (standings.length === 0 && tournament.registeredTeams && tournament.registeredTeams.length > 0) {
    const initStandings = tournament.registeredTeams.map((team, idx) => ({
      tournamentId: id,
      teamId: team._id,
      rank: idx + 1,
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      drawn: 0,
      points: 0,
      netRunRate: 0,
      goalDifference: 0,
      streak: [],
    }));
    await Standing.insertMany(initStandings);
    standings = await Standing.find({ tournamentId: id })
      .populate('teamId', 'name sport logo captainId')
      .sort({ rank: 1 });
  }

  successResponse(res, { tournament, standings });
};
