const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
};

const ok = (body) => ({
  statusCode: 200,
  headers,
  body: JSON.stringify(body),
});

const created = (body) => ({
  statusCode: 201,
  headers,
  body: JSON.stringify(body),
});

const badRequest = (message) => ({
  statusCode: 400,
  headers,
  body: JSON.stringify({ error: message }),
});

const unauthorized = (message = 'Unauthorized') => ({
  statusCode: 401,
  headers,
  body: JSON.stringify({ error: message }),
});

const forbidden = (message = 'Forbidden') => ({
  statusCode: 403,
  headers,
  body: JSON.stringify({ error: message }),
});

const notFound = (message = 'Not found') => ({
  statusCode: 404,
  headers,
  body: JSON.stringify({ error: message }),
});

const serverError = (message = 'Internal server error') => ({
  statusCode: 500,
  headers,
  body: JSON.stringify({ error: message }),
});

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, serverError };
