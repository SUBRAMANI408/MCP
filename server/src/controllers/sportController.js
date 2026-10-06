const Sport = require('../models/Sport');
const { successResponse } = require('../utils/apiResponse');

exports.createSport = async (req, res) => {
  const { name, scoringSchema, icon, isActive = true } = req.body;
  const sport = await Sport.create({ name, scoringSchema, icon, isActive });
  successResponse(res, sport, 'Sport created', 201);
};

exports.seedDefaultSports = async (req, res) => {
  const defaultSports = [
    {
      name: 'Cricket',
      icon: '🏏',
      isActive: true,
      scoringSchema: {
        rules: 'Runs, wickets, balls, overs',
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
        rules: 'Goals, fouls, cards',
        fields: [
          { key: 'goals', label: 'Goals', type: 'number', required: true },
          { key: 'fouls', label: 'Fouls', type: 'number', required: false },
        ]
      }
    },
    {
      name: 'Basketball',
      icon: '🏀',
      isActive: true,
      scoringSchema: {
        rules: 'Points, rebounds, assists',
        fields: [
          { key: 'points', label: 'Points', type: 'number', required: true },
          { key: 'rebounds', label: 'Rebounds', type: 'number', required: false },
        ]
      }
    },
    {
      name: 'Volleyball',
      icon: '🏐',
      isActive: true,
      scoringSchema: {
        rules: 'Sets won, aces, blocks',
        fields: [
          { key: 'sets', label: 'Sets Won', type: 'number', required: true },
        ]
      }
    },
    {
      name: 'Tennis',
      icon: '🎾',
      isActive: true,
      scoringSchema: {
        rules: 'Sets, games, tiebreaks',
        fields: [
          { key: 'sets', label: 'Sets Won', type: 'number', required: true },
        ]
      }
    },
    {
      name: 'Badminton',
      icon: '🏸',
      isActive: true,
      scoringSchema: {
        rules: 'Sets won, smash points',
        fields: [
          { key: 'sets', label: 'Sets Won', type: 'number', required: true },
        ]
      }
    },
    {
      name: 'Table Tennis',
      icon: '🏓',
      isActive: true,
      scoringSchema: {
        rules: 'Games won, rally points',
        fields: [
          { key: 'games', label: 'Games Won', type: 'number', required: true },
        ]
      }
    },
    {
      name: 'Hockey',
      icon: '🏑',
      isActive: true,
      scoringSchema: {
        rules: 'Goals, penalty corners',
        fields: [
          { key: 'goals', label: 'Goals', type: 'number', required: true },
        ]
      }
    },
    {
      name: 'Baseball',
      icon: '⚾',
      isActive: true,
      scoringSchema: {
        rules: 'Runs, hits, innings',
        fields: [
          { key: 'runs', label: 'Runs', type: 'number', required: true },
        ]
      }
    },
    {
      name: 'Rugby',
      icon: '🏉',
      isActive: true,
      scoringSchema: {
        rules: 'Tries, conversions, penalties',
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
        rules: 'Lap times, finishing rank',
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
        rules: 'Event timings, finish position',
        fields: [
          { key: 'position', label: 'Finish Position', type: 'number', required: true },
        ]
      }
    }
  ];

  for (const s of defaultSports) {
    await Sport.findOneAndUpdate(
      { name: s.name },
      { $setOnInsert: s },
      { upsert: true, new: true }
    );
  }

  const all = await Sport.find().sort({ name: 1 });
  successResponse(res, all, 'Default sports seeded successfully');
};

exports.getSports = async (req, res) => {
  const { isActive } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  const sports = await Sport.find(query).sort({ name: 1 });
  successResponse(res, sports);
};

exports.getSport = async (req, res) => {
  const sport = await Sport.findById(req.params.id);
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, sport);
};

exports.updateSport = async (req, res) => {
  const sport = await Sport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, sport, 'Sport updated');
};

exports.deleteSport = async (req, res) => {
  const sport = await Sport.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, null, 'Sport deactivated');
};

exports.toggleSport = async (req, res) => {
  const sport = await Sport.findById(req.params.id);
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  sport.isActive = !sport.isActive;
  await sport.save();
  successResponse(res, sport, `Sport ${sport.isActive ? 'activated' : 'deactivated'}`);
};

exports.hardDeleteSport = async (req, res) => {
  const sport = await Sport.findByIdAndDelete(req.params.id);
  if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
  successResponse(res, null, 'Sport permanently deleted');
};
