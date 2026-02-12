import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error('MONGO_URI not set. Add it to your .env or environment variables.');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Ping successful — connected to MongoDB');
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
