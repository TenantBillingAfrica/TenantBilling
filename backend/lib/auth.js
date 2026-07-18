const { forbidden } = require('./response');

/**
 * Extract user claims from API Gateway JWT authorizer context.
 * API Gateway HTTP API with JWT authorizer puts claims in event.requestContext.authorizer.jwt.claims
 */
function getClaims(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims) return null;
  return {
    sub: claims.sub,
    email: claims.email,
    role: claims['custom:role'],
    instanceId: claims['custom:instanceId'],
    instanceName: claims['custom:instanceName'],
  };
}

/**
 * Guard: require one of the allowed roles.
 * Returns null if authorized, or a 403 response if not.
 */
function requireRole(claims, ...allowedRoles) {
  if (!claims) return forbidden('No valid authentication token');
  if (!allowedRoles.includes(claims.role)) {
    return forbidden(`Role '${claims.role}' is not authorized for this action`);
  }
  return null;
}

module.exports = { getClaims, requireRole };
