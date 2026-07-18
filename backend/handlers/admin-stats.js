const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/dynamo');
const { getClaims, requireRole } = require('../lib/auth');
const { ok, badRequest, serverError } = require('../lib/response');

exports.handler = async (event) => {
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
    console.error(err);
    return serverError(err.message);
  }
};

async function getStats() {
  const [applications, users, tenants, buildings] = await Promise.all([
    scan(process.env.APPLICATIONS_TABLE),
    scan(process.env.USERS_TABLE),
    scan(process.env.TENANTS_TABLE),
    scan(process.env.BUILDINGS_TABLE),
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
    scan(process.env.INVOICES_TABLE),
    scan(process.env.PAYMENTS_TABLE),
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

async function scan(tableName) {
  const items = [];
  let lastKey;
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastKey,
    }));
    items.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return items;
}
