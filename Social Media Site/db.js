import { MongoClient } from "mongodb";

const url = "mongodb://localhost:27017";
const dbName = "social-media-db";
const client = new MongoClient(url);

//Function to connect to the database
async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to the database");

        const db = client.db(dbName);

        //Check and initialize the database collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map((col) => col.name);

        //Create `posts` collection if it doesn't exist
        if (!collectionNames.includes("posts")) {
            await db.createCollection("posts");
            console.log("Created 'posts' collection");
        }

        //Create `users` collection if it doesn't exist
        if (!collectionNames.includes("users")) {
            await db.createCollection("users");
            console.log("Created 'users' collection");
        }

        if (!collectionNames.includes("images")) {
            await db.createCollection("images");
            console.log("Created 'images' collection");
        }

        return db;
    } catch (error) {
        console.error("Error connecting to the database", error);
        throw error;
    }
}

export default connectDatabase;