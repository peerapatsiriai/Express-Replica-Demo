import { PrismaClient } from "@prisma/client";

export const writeDB = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
export const readDB = new PrismaClient({ datasources: { db: { url: process.env.REPLICA_1_URL } } });
