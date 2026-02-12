import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getUserById, createOrUpdateUser } from '../models/user.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      proxy: true, // Trust proxy for HTTPS behind Azure/IIS
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await createOrUpdateUser({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          picture: profile.photos?.[0]?.value || '',
        });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
