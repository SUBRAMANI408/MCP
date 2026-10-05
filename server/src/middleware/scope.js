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

module.exports = {
  sameAssociation,
  requireAssociation,
  denyIfCrossTenant
};
