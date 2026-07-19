const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { setEvent, ok, badRequest, serverError } = require('../lib/response');

const SCAN_LIMIT = 1000;

exports.handler = async (event) => {
  setEvent(event);
  const claims = getClaims(event);
  const denied = requireRole(claims, 'system_admin');
  if (denied) return denied;

  const path = event.rawPath;

  try {
    if (path === '/admin/stats') {
      return await getStats();
    }
    if (path === '/admin/pnl') {
      return await getPnL();
    }
    return badRequest('Unknown route');
  } catch (err) {
    console.error('AdminStatsHandler error:', err);
    return serverError('An unexpected error occurred');
  }
};

async function getStats() {
  const [applications, users, tenants, buildings] = await Promise.all([
    scanLimited(process.env.APPLICATIONS_TABLE),
    scanLimited(process.env.USERS_TABLE),
    scanLimited(process.env.TENANTS_TABLE),
    scanLimited(process.env.BUILDINGS_TABLE),
  ]);

  const activeInstances = applications.filter(a => a.status === 'approved');
  const pendingApplications = applications.filter(a => a.status === 'pending');
  const totalTenants = tenants.length;
  const totalBuildings = buildings.length;

  return ok({
    totalInstances: activeInstances.length,
    totalTenants,
    totalBuildings,
    pendingApplications: pendingApplications.length,
    totalUsers: users.length,
    recentApplications: applications
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10),
  });
}

async function getPnL() {
  const [invoices, payments] = await Promise.all([
    scanLimited(process.env.INVOICES_TABLE),
    scanLimited(process.env.PAYMENTS_TABLE),
  ]);

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const platformShare = totalCollected * 0.3;
  const operatorShare = totalCollected * 0.7;

  // Group by month
  const monthlyRevenue = {};
  for (const inv of invoices) {
    const month = inv.period || inv.createdAt?.slice(0, 7) || 'unknown';
    if (!monthlyRevenue[month]) monthlyRevenue[month] = { billed: 0, collected: 0 };
    monthlyRevenue[month].billed += inv.totalAmount || 0;
  }
  for (const pay of payments.filter(p => p.status === 'completed')) {
    const month = pay.createdAt?.slice(0, 7) || 'unknown';
    if (!monthlyRevenue[month]) monthlyRevenue[month] = { billed: 0, collected: 0 };
    monthlyRevenue[month].collected += pay.amount || 0;
  }

  return ok({
    totalBilled,
    totalCollected,
    platformShare,
    operatorShare,
    collectionRate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : 0,
    monthlyRevenue,
  });
}

/**
 * Scan with a hard limit to prevent loading unbounded data.
 * Paginates up to SCAN_LIMIT items maximum.
 */
async function scanLimited(tableName) {
  const items = [];
  let lastKey;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastKey,
      Limit: SCAN_LIMIT,
    }));
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey && items.length < SCAN_LIMIT);
  return items.slice(0, SCAN_LIMIT);
}
