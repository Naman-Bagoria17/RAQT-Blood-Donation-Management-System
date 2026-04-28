/**
 * Middleware: Role-Based Access Control (RBAC)
 * Usage: authorize('donor') or authorize('doctor') or authorize('donor', 'doctor')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
      });
    }
    next();
  };
};

module.exports = { authorize };
