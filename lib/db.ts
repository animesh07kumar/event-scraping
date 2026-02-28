import mongoose, { Mongoose } from "mongoose"
import { DB_NAME } from "@/constants/constants"

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI")
}

declare global {
  var _mongoose: {
    conn: Mongoose | null
    promise: Promise<Mongoose> | null
  } | undefined
}

let cached = global._mongoose

if (!cached) {
  cached = global._mongoose = {
    conn: null,
    promise: null,
  }
}

export async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      dbName: DB_NAME,
    }

    cached!.promise = mongoose.connect(MONGODB_URI, opts)
  }

  cached!.conn = await cached!.promise
  return cached!.conn
}
