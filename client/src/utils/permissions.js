export const ROLES = {
  ADMIN: 'admin',
  ASSOCIATION_HEAD: 'association_head',
  TOURNAMENT_ORGANIZER: 'tournament_organizer',
  CAPTAIN: 'captain',
  VICE_CAPTAIN: 'vice_captain',
  GROUND_OFFICER: 'ground_officer',
  FUNDS_OFFICER: 'funds_officer',
  PLAYER: 'player',
};

export const ROLE_LABELS = {
  admin: 'System Admin',
  association_head: 'Association Head',
  tournament_organizer: 'Tournament Organizer',
  captain: 'Team Captain',
  vice_captain: 'Vice Captain',
  ground_officer: 'Ground Booking Officer',
  funds_officer: 'Funds Officer',
  player: 'Player',
};

export const PERMISSIONS = {
  createTeam: ['captain'],
  approveTeam: ['admin', 'association_head'],
  createTournament: ['tournament_organizer', 'admin'],
  approveTournament: ['association_head', 'admin'],
  manageBookings: ['ground_officer', 'admin', 'association_head'],
  manageFunds: ['funds_officer', 'admin'],
  approveExpense: ['association_head', 'admin'],
  viewAdminDashboard: ['admin'],
  viewAssociationDashboard: ['admin', 'association_head'],
  scoreMatch: ['captain', 'vice_captain', 'player', 'tournament_organizer', 'admin'],
  createAnnouncement: ['association_head', 'admin'],
};

export const can = (userRole, permission) => {
  return PERMISSIONS[permission]?.includes(userRole) ?? false;
};

export const getDashboardRoute = (role) => {
  const routes = {
    admin: '/admin/dashboard',
    association_head: '/association/dashboard',
    tournament_organizer: '/tournament/dashboard',
    captain: '/team/dashboard',
    vice_captain: '/team/dashboard',
    ground_officer: '/bookings/dashboard',
    funds_officer: '/funds/dashboard',
    player: '/player/dashboard',
  };
  return routes[role] || '/login';
};
