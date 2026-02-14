import { getDB } from '../db/db.js';

const COLLECTION_NAME = 'users';

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const db = getDB();
  const user = await db.collection(COLLECTION_NAME).findOne({ _id: id });
  return user;
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId) {
  const db = getDB();
  const user = await db.collection(COLLECTION_NAME).findOne({ googleId });
  return user;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const db = getDB();
  const user = await db.collection(COLLECTION_NAME).findOne({ email });
  return user;
}

/**
 * Create or update user from Google OAuth
 */
export async function createOrUpdateUser(userData) {
  const db = getDB();
  const { googleId, email, name, picture } = userData;

  const existingUser = await getUserByGoogleId(googleId);

  if (existingUser) {
    // Update existing user
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
      { googleId },
      {
        $set: {
          email,
          name,
          picture,
          lastLogin: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
    return result;
  } else {
    // Create new user with default 'user' role
    const newUser = {
      googleId,
      email,
      name,
      picture,
      createdAt: new Date(),
      lastLogin: new Date(),
      role: 'user'
    };
    const result = await db.collection(COLLECTION_NAME).insertOne(newUser);
    return { ...newUser, _id: result.insertedId };
  }
}

/**
 * Get all users (for agent assignments)
 */
export async function getAllUsers() {
  const db = getDB();
  const users = await db.collection(COLLECTION_NAME).find({}).toArray();
  return users;
}
