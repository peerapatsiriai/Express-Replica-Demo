import amqp from "amqplib";
import appConfig from "../appConfig";
import { readDB } from "../services/prisma.service";
import { Product } from "@prisma/client";
import { QUEUES } from "../dto/queue.dto"

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processWithRetry(
    operation: () => Promise<void>, 
    channel: amqp.Channel, 
    data: amqp.ConsumeMessage,
    retryCount = 0
) {
    try {
        await operation();
        channel.ack(data);
    } catch (error) {
        console.error(`Error processing message (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
        
        if (retryCount < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY);
            return processWithRetry(operation, channel, data, retryCount + 1);
        } else {
            console.error('Max retries reached, rejecting message');
            channel.nack(data, false, false); // Don't requeue after max retries
        }
    }
}

export const startConsumer = async () => {
    try {
        const connection = await amqp.connect(appConfig.rabbitMqUrl as string);
        const channel = await connection.createChannel();
        
        await channel.assertQueue(QUEUES.PRODUCT_SYNC);
        await channel.assertQueue(QUEUES.PRODUCT_DELETE);
        
        console.log('Consumer started: Waiting for messages...');
        
        channel.consume(QUEUES.PRODUCT_SYNC, async (data) => {
            if (data) {
                const product: Product = JSON.parse(data.content.toString());
                await processWithRetry(async () => {
                    await readDB.product.upsert({
                        where: { id: product.id },
                        update: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            stock: product.stock,
                            updatedAt: product.updatedAt
                        },
                        create: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            stock: product.stock,
                            createdAt: product.createdAt,
                            updatedAt: product.updatedAt
                        }
                    });
                    console.log(`Product ${product.id} upsert in replica`);
                }, channel, data);
            }
        });

        channel.consume(QUEUES.PRODUCT_DELETE, async (data) => {
            if (data) {
                const productId = data.content.toString();
                await processWithRetry(async () => {
                    await readDB.product.delete({
                        where: { id: productId }
                    });
                    console.log(`Product ${productId} deleted in replica`);
                }, channel, data);
            }
        });

        channel.on('close', () => {
            console.log('Consumer closed');
        });
    } catch (error) {
        console.error('Error starting consumer:', error);
    }
};