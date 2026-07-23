// OTP send/verify handler — delegates to otp-config which handles all OTP routes
exports.handler = require('./otp-config').handler;
