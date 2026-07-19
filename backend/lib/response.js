const ALLOWED_ORIGINS = [
  'https://main.d3l8nnw6zdjdhc.amplifyapp.com',
  'https://www.tenantbilling.africa',
  'https://tenantbilling.africa',
  'http://localhost:3000',
];

let _currentEvent = null;

/**
 * Set the current event for CORS header resolution.
 * Call this at the top of each handler.
 */
function setEvent(event) {
  _currentEvent = event;
}

function getHeaders() {
  const origin = _currentEvent?.headers?.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Signature',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const ok = (body) => ({
  statusCode: 200,
  headers: getHeaders(),
  body: JSON.stringify(body),
});

const created = (body) => ({
  statusCode: 201,
  headers: getHeaders(),
  body: JSON.stringify(body),
});

const badRequest = (message) => ({
  statusCode: 400,
  headers: getHeaders(),
  body: JSON.stringify({ error: message }),
});

const unauthorized = (message = 'Unauthorized') => ({
  statusCode: 401,
  headers: getHeaders(),
  body: JSON.stringify({ error: message }),
});

const forbidden = (message = 'Forbidden') => ({
  statusCode: 403,
  headers: getHeaders(),
  body: JSON.stringify({ error: message }),
});

const notFound = (message = 'Not found') => ({
  statusCode: 404,
  headers: getHeaders(),
  body: JSON.stringify({ error: message }),
});

const serverError = (message = 'Internal server error') => ({
  statusCode: 500,
  headers: getHeaders(),
  body: JSON.stringify({ error: message }),
});

module.exports = { setEvent, ok, created, badRequest, unauthorized, forbidden, notFound, serverError };
