import { useAuthStore } from '../app/store';

export const useRoleGuard = (allowedRoles) => {
  const { user } = useAuthStore();
  if (!user) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(user.role);
};

export const useIsRole = (role) => {
  const { user } = useAuthStore();
  return user?.role === role;
};

export const useIsAdmin = () => useIsRole('admin');
export const useIsAssociationHead = () => useIsRole('association_head');
export const useIsCaptain = () => useIsRole('captain');
export const useIsViceCaptain = () => useIsRole('vice_captain');
export const useIsPlayer = () => useIsRole('player');
export const useIsGroundOfficer = () => useIsRole('ground_officer');
export const useIsFundsOfficer = () => useIsRole('funds_officer');
export const useIsTournamentOrganizer = () => useIsRole('tournament_organizer');
