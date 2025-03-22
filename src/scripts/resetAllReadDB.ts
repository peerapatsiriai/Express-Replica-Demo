import { resetAndSyncReplicas } from "../services/prisma.service"

async function main() {
    try {
        console.log('Starting database reset and sync...');
        await resetAndSyncReplicas();
        console.log('Database reset and sync completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during database reset and sync:', error);
        process.exit(1);
    }
}

main();