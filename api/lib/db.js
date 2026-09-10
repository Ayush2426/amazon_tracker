import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error("MONGODB_URI is not defined");
}

let cached = globalThis.__mongoCache;

if (!cached) {
    cached = globalThis.__mongoCache = {
        client: null,
        promise: null,
    };
}

export async function getDatabase() {
    if (cached.client) {
        return cached.client.db("spiderverse_amazon_tracker");
    }

    if (!cached.promise) {
        cached.promise = MongoClient.connect(uri);
    }

    cached.client = await cached.promise;

    return cached.client.db("spiderverse_amazon_tracker");
}