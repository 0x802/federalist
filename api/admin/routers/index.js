const { Router } = require('express');
const AdminBuildController = require('../controllers/build');
const AdminEventController = require('../controllers/event');
const AdminSiteController = require('../controllers/site');
const UserController = require('../controllers/user');
const auth = require('./auth');

const ensureAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.unauthorized();
  }
  return next();
};

const authenticatedRouter = Router();
authenticatedRouter.use(ensureAuthenticated);
authenticatedRouter.get('/builds', AdminBuildController.list);
authenticatedRouter.get('/builds/:id', AdminBuildController.findById);
authenticatedRouter.get('/builds/:id/log', AdminBuildController.findBuildLog);
authenticatedRouter.get('/events', AdminEventController.list);
authenticatedRouter.get('/sites', AdminSiteController.findAllSites);
authenticatedRouter.get('/sites/:id', AdminSiteController.findById);
authenticatedRouter.put('/sites/:id', AdminSiteController.update);
authenticatedRouter.delete('/sites/:id', AdminSiteController.destroy);
authenticatedRouter.get('/me', UserController.me);

const adminRouter = Router();
adminRouter.use(auth);
adminRouter.use(authenticatedRouter);

module.exports = adminRouter;
