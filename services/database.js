const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://ikhideatakpu_db_user:G8qeulkutmxwwCbW@cluster0.xz61rhz.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let squeaks;
let credentials;
let sessions;

async function connectToDatabase() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    db = client.db("Squeak!");

    squeaks = db.collection("squeaks");
    credentials = db.collection("credentials");
    sessions = db.collection("sessions");

    console.log("Collections initialized");

    return { squeaks, credentials, sessions };
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

function getCollections() {
  if (!db || !squeaks || !credentials || !sessions) {
    throw new Error("Database not connected. Call connectToDatabase() first.");
  }
  return { squeaks, credentials, sessions };
}

async function closeConnection() {
  try {
    await client.close();
    console.log("MongoDB connection closed");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
  }
}

async function authenticate(username, password) {
  const { credentials } = getCollections();

  let user = await credentials.findOne({
    username: username,
    password: password,
  });

  return user !== null;
}

async function addUser(username, password) {
  const { credentials } = getCollections();
  await credentials.insertOne({
    username: username,
    password: password,
  });
}

async function getUsers() {
  const { credentials } = getCollections();
  const users = await credentials
    .find({}, { projection: { username: 1, _id: 0 } })
    .toArray();
  return users.map((u) => u.username);
}

module.exports = {
  connectToDatabase,
  getCollections,
  closeConnection,
  authenticate,
  addUser,
  getUsers,
  client,
};
