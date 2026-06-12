import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - database
 * 03. 설명     : database 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

dotenv.config();

let connectMongoDB: Promise<MongoClient>;
let prisma: PrismaClient;

type GlobalDatabaseCache = typeof globalThis & {
  _mongo?: Promise<MongoClient>;
  prisma?: PrismaClient;
};

const globalForDb = globalThis as GlobalDatabaseCache;

if (process.env.NODE_ENV === 'development') {
  const mongo = globalForDb._mongo ?? new MongoClient(process.env.MONGO_URL as string).connect();
  globalForDb._mongo = mongo;

  const prismaClient = globalForDb.prisma ?? new PrismaClient();
  globalForDb.prisma = prismaClient;

  connectMongoDB = mongo;
  prisma = prismaClient;
} else {
  connectMongoDB = new MongoClient(process.env.MONGO_URL as string).connect();
  prisma = new PrismaClient();
}

export { connectMongoDB, prisma };
