const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  cognito: {
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
    clientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
    region: process.env.REACT_APP_REGION || 'eu-north-1',
  },
};

export default config;
