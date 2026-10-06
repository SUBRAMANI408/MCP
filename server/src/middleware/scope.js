/**
 * Tenant scoping middleware
 * Enforces cross-association security boundaries
 */

const sameAssociation = (resourceAssocId, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true; // System Admin has global access
  if (!user.associationId || !resourceAssocId) return false;
  const uId = user.associationId._id ? user.associationId._id.toString() : user.associationId.toString();
  const rId = resourceAssocId._id ? resourceAssocId._id.toString() : resourceAssocId.toString();
  return uId === rId;
};

const requireAssociation = (paramName = 'associationId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'admin') {
      return next();
    }

    const targetAssocId = req.params[paramName] || req.query[paramName] || (req.body && req.body[paramName]);

    if (!targetAssocId) {
      // Auto-scope to user's association if not explicitly provided
      if (req.user.associationId) {
        if (req.method === 'GET') {
          req.query[paramName] = req.user.associationId.toString();
        } else if (req.body && typeof req.body === 'object') {
          req.body[paramName] = req.user.associationId;
        }
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Access denied: User does not belong to any association'
      });
    }

    if (!sameAssociation(targetAssocId, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Cross-association access is forbidden'
      });
    }

    next();
  };
};

const denyIfCrossTenant = (docAssocId, user, res) => {
  if (!sameAssociation(docAssocId, user)) {
    res.status(403).json({
      success: false,
      message: 'Access denied: You cannot view or modify resources from another association'
    });
    return true; // Denied
  }
  return false; // Permitted
};

const docAssociationGuard = (Model, idParam = 'id', assocField = 'associationId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (req.user.role === 'admin') return next();

    const id = req.params[idParam];
    if (!id) return next();

    try {
      const doc = await Model.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: 'Resource not found' });
      let assocId = doc[assocField];
      if (!assocId && doc.groundId) {
        const Ground = require('../models/Ground');
        const ground = await Ground.findById(doc.groundId).select('associationId');
        if (ground) assocId = ground.associationId;
      }
      if (!assocId && doc.tournamentId) {
        const Tournament = require('../models/Tournament');
        const tournament = await Tournament.findById(doc.tournamentId).select('associationId');
        if (tournament) assocId = tournament.associationId;
      }
      if (!assocId && doc.teamId) {
        const Team = require('../models/Team');
        const team = await Team.findById(doc.teamId).select('associationId');
        if (team) assocId = team.associationId;
      }

      if (assocId && denyIfCrossTenant(assocId, req.user, res)) {
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  sameAssociation,
  requireAssociation,
  denyIfCrossTenant,
  docAssociationGuard,
};
