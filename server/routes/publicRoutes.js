const express = require('express');
const router = express.Router();
const { getJobDetailsForApply, applyAndStartAssessment } = require('../controllers/publicController');

router.get('/jobs/:jobToken', getJobDetailsForApply);
router.post('/jobs/:jobToken/register', applyAndStartAssessment);
router.post('/apply/:jobToken', applyAndStartAssessment);

module.exports = router;
