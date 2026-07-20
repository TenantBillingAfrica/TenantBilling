import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import config from '../config';

const userPool = new CognitoUserPool({
  UserPoolId: config.cognito.userPoolId,
  ClientId: config.cognito.clientId,
});

/**
 * Authenticate user with email and password.
 * Returns { user, idToken } on success.
 * If newPasswordRequired, returns { challengeName: 'NEW_PASSWORD_REQUIRED', cognitoUser }.
 */
export function login(email, password) {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const payload = session.getIdToken().decodePayload();
        resolve({
          idToken,
          user: {
            id: payload.sub,
            email: payload.email,
            phone: payload.phone_number || payload['phone_number'] || '',
            role: payload['custom:role'],
            instanceId: payload['custom:instanceId'],
            instanceName: payload['custom:instanceName'],
            name: payload.email ? payload.email.split('@')[0] : 'User',
          },
        });
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: (userAttributes) => {
        resolve({
          challengeName: 'NEW_PASSWORD_REQUIRED',
          cognitoUser,
          userAttributes,
        });
      },
      mfaRequired: (challengeName, challengeParameters) => {
        resolve({
          challengeName: challengeName || 'MFA_REQUIRED',
          cognitoUser,
          destination: challengeParameters ? challengeParameters.CODE_DELIVERY_DESTINATION : null,
        });
      },
      totpRequired: (challengeName, challengeParameters) => {
        resolve({
          challengeName: challengeName || 'TOTP_REQUIRED',
          cognitoUser,
          challengeParameters,
        });
      },
      mfaSetup: (challengeName, challengeParameters) => {
        resolve({
          challengeName: challengeName || 'MFA_SETUP',
          cognitoUser,
          challengeParameters,
        });
      },
      selectMFAType: (challengeName, challengeParameters) => {
        resolve({
          challengeName: challengeName || 'SELECT_MFA_TYPE',
          cognitoUser,
          challengeParameters,
        });
      },
      customChallenge: (challengeParameters) => {
        resolve({
          challengeName: 'CUSTOM_CHALLENGE',
          cognitoUser,
          challengeParameters,
        });
      },
    });
  });
}

/**
 * Complete MFA verification challenge (SMS_MFA or SOFTWARE_TOKEN_MFA).
 */
export function confirmMfaCode(cognitoUser, mfaCode, mfaType = 'SMS_MFA') {
  return new Promise((resolve, reject) => {
    cognitoUser.sendMFACode(mfaCode, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const payload = session.getIdToken().decodePayload();
        resolve({
          idToken,
          user: {
            id: payload.sub,
            email: payload.email,
            role: payload['custom:role'],
            instanceId: payload['custom:instanceId'],
            instanceName: payload['custom:instanceName'],
            name: payload.email ? payload.email.split('@')[0] : 'User',
          },
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    }, mfaType);
  });
}

/**
 * Complete the NEW_PASSWORD_REQUIRED challenge.
 */
export function completeNewPassword(cognitoUser, newPassword) {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
      onSuccess: (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const payload = session.getIdToken().decodePayload();
        resolve({
          idToken,
          user: {
            id: payload.sub,
            email: payload.email,
            phone: payload.phone_number || payload['phone_number'] || '',
            role: payload['custom:role'],
            instanceId: payload['custom:instanceId'],
            instanceName: payload['custom:instanceName'],
            name: payload.email ? payload.email.split('@')[0] : 'User',
          },
        });
      },
      onFailure: reject,
    });
  });
}

/**
 * Sign out the current user.
 */
export function logout() {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
  localStorage.removeItem('tb_id_token');
  localStorage.removeItem('tb_user');
}

/**
 * Get current session and refresh token if needed.
 */
export function getCurrentSession() {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }
      if (session && session.isValid()) {
        const idToken = session.getIdToken().getJwtToken();
        const payload = session.getIdToken().decodePayload();
        resolve({
          idToken,
          user: {
            id: payload.sub,
            email: payload.email,
            phone: payload.phone_number || payload['phone_number'] || '',
            role: payload['custom:role'],
            instanceId: payload['custom:instanceId'],
            instanceName: payload['custom:instanceName'],
            name: payload.email ? payload.email.split('@')[0] : 'User',
          },
        });
      } else {
        resolve(null);
      }
    });
  });
}
