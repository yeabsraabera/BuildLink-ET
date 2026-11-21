import mongoose from "mongoose";

import "@/models/User";
import "@/models/Listing";
import "@/models/Request";
import "@/models/Report";
import "@/models/AdminLog";
import "@/models/Location";
import "@/models/Review";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & {
  __buildlinkMongoose?: MongooseCache;
};

function cache() {
  if (!globalCache.__buildlinkMongoose) {
    globalCache.__buildlinkMongoose = { conn: null, promise: null };
  }
  return globalCache.__buildlinkMongoose;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  const cached = cache();
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
