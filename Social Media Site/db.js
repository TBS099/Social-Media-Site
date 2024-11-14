import { MongoClient } from "mongodb";

const url = "mongodb://localhost:27017";
const dbName = "social-media-db";
const client = new MongoClient(url);

//Function to connect to the database
async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to the database");
        return client.db(dbName);
    } catch (error) {
        console.error("Error connecting to the database", error);
        throw error;
    }
}

export default connectDatabase;