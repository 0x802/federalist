const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { logger } = require('../../winston');
const { User, Event } = require('../models');
const GitHub = require('./GitHub');
const RepositoryVerifier = require('./RepositoryVerifier');
const EventCreator = require('./EventCreator');
const { createUAAStrategy } = require('./uaaStrategy');

const passport = new Passport.Passport();

const {
  github: { options: githubOptions },
  uaa: { options: uaaOptions },
} = config.passport;

async function verifyGithub(accessToken, _refreshToken, profile, callback) {
  try {
    const isValidUser = await GitHub.validateUser(accessToken, false);
    if (!isValidUser) {
      return callback(null, false);
    }

    const username = profile.username.toLowerCase();
    // eslint-disable-next-line no-underscore-dangle
    const { email } = profile._json;

    const [user] = await User.upsert({
      username,
      email,
      githubAccessToken: accessToken,
      githubUserId: profile.id,
      signedInAt: new Date(),
    });

    EventCreator.audit(Event.labels.AUTHENTICATION, user, { action: 'login' });

    RepositoryVerifier.verifyUserRepos(user);

    return callback(null, user);
  } catch (err) {
    logger.warn('Authentication error: ', err);
    return callback(err);
  }
}

async function verifyUAA(accessToken, _refreshToken, profile, callback) {
  const { email } = profile;

  try {
    const user = await User.findOne({ where: { adminEmail: email } });

    if (!user) {
      return callback(null, false);
    }

    await user.update({
      signedInAt: new Date(),
    });

    EventCreator.audit(Event.labels.AUTHENTICATION, user, { action: 'login' });

    RepositoryVerifier.verifyUserRepos(user);

    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
}

const uaaStrategy = createUAAStrategy(uaaOptions, verifyUAA);

passport.use(new GitHubStrategy(githubOptions, verifyGithub));
passport.use('uaa', uaaStrategy);

passport.logout = (idp) => {
  const redirectURL = idp === 'uaa' ? uaaStrategy.logoutRedirectURL : '/';
  return (req, res) => {
    const { user } = req;
    req.logout();
    if (user) {
      EventCreator.audit(Event.labels.AUTHENTICATION, user, { action: 'logout' });
    }
    req.session.destroy(() => {
      res.redirect(redirectURL);
    });
  };
};

passport.serializeUser((user, next) => {
  next(null, user.id);
});

passport.deserializeUser((id, next) => {
  User.findByPk(id).then((user) => {
    next(null, user);
  });
});

module.exports = passport;
