const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../../lib/dynamo');

/**
 * Cognito PostConfirmation trigger.
 * Saves the confirmed user to the TB_Users table.
 */
exports.handler = async (event) => {
  const { sub, email } = event.request.userAttributes;
  const role = event.request.userAttributes['custom:role'] || 'instance_admin';
  const instanceId = event.request.userAttributes['custom:instanceId'] || '';
  const instanceName = event.request.userAttributes['custom:instanceName'] || '';

  await docClient.send(new PutCommand({
    TableName: process.env.USERS_TABLE,
    Item: {
      id: sub,
      email,
      role,
      instanceId,
      instanceName,
      createdAt: new Date().toISOString(),
      status: 'active',
    },
  }));

  return event;
};
