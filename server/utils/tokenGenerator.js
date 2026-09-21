const crypto = require('crypto');

const generateAssessmentToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

module.exports = {
  generateAssessmentToken
};
