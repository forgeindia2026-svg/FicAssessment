const express = require('express');
const router = express.Router();
const { getResults, getResultById } = require('../controllers/resultController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.use(protectAdmin);

router.get('/', getResults);
router.get('/:id', getResultById);

module.exports = router;
