/**
 * Cognito PreSignUp trigger.
 * Auto-confirms users created by admins (via AdminCreateUser the user
 * is already confirmed, but this handles edge cases).
 * For self-registered users, auto-verify email if coming from application approval.
 */
exports.handler = async (event) => {
  // If the user was created by an admin (e.g. via application approval),
  // auto-confirm and auto-verify email
  if (event.triggerSource === 'PreSignUp_AdminCreateUser') {
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
  }

  return event;
};
