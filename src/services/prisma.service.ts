import { PrismaClient } from "@prisma/client";
import appConfig from "../appConfig";

export const writeDB = new PrismaClient({ datasources: { db: { url: appConfig.databaseUrl } } });

export const readDBReplicas = [
    new PrismaClient({ datasources: { db: { url: appConfig.replica1Url } } }),
    new PrismaClient({ datasources: { db: { url: appConfig.replica2Url } } })
];

let currentReplicaIndex = 0;

export const loadBalanceReadDB = () => {
    // Round-robin selection
    currentReplicaIndex = (currentReplicaIndex + 1) % readDBReplicas.length;
    return readDBReplicas[currentReplicaIndex];
};

export const getRandomReadDB = () => {
    const randomIndex = Math.floor(Math.random() * readDBReplicas.length);
    console.log(`Random index: ${randomIndex}`);
    return readDBReplicas[randomIndex];
};

const clearAllReadDBs = async () => {
    try {
        const clearOperations = readDBReplicas.map(async (db) => {
            await db.product.deleteMany({});
        });
        
        await Promise.all(clearOperations);
        console.log('All read databases cleared successfully');
    } catch (error) {
        console.error('Error clearing read databases:', error);
        throw error;
    }
};

const syncReplicasFromWriteDB = async () => {
    try {
        // 1. Get all data from write DB
        const sourceData = await writeDB.product.findMany();
        
        // 2. Create operations for each replica
        const syncOperations = readDBReplicas.map(async (db) => {
            // Clear existing data
            await db.product.deleteMany({});
            
            // Batch create all records
            if (sourceData.length > 0) {
                await db.product.createMany({
                    data: sourceData
                });
            }
        });
        
        // 3. Execute all operations
        await Promise.all(syncOperations);
        console.log(`Synced ${sourceData.length} records to all read replicas`);
    } catch (error) {
        console.error('Error syncing replicas:', error);
        throw error;
    }
};

export const resetAndSyncReplicas = async () => {
    try {
        await clearAllReadDBs();
        await syncReplicasFromWriteDB();
        console.log('Reset and sync completed successfully');
    } catch (error) {
        console.error('Error in reset and sync operation:', error);
        throw error;
    }
};