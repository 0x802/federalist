const router = require('express').Router();
const BuildLogController = require('../controllers/build-log');
const sessionAuth = require('../policies/sessionAuth');

router.get('/build/:build_id/log(/page/:page)?', sessionAuth, BuildLogController.find);
router.post('/build/:build_id/log/:token', BuildLogController.create);

module.exports = router;
