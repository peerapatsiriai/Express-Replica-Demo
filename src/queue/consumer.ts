import amqp from "amqplib";
import appConfig from "../appConfig";
import { readDBReplicas } from "../services/prisma.service";
import { Product } from "@prisma/client";
import { QUEUES } from "../dto/queue.dto";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function processWithRetry(
    operations: Promise<void>[],
    channel: amqp.Channel,
    data: amqp.ConsumeMessage,
    retryCount = 0
) {
    try {
        await Promise.all(operations);
        channel.ack(data);
    } catch (error) {
        console.error(
            `Error processing message (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
            error
        );

        if (retryCount < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY);
            return processWithRetry(operations, channel, data, retryCount + 1);
        } else {
            console.error("Max retries reached, rejecting message");
            channel.nack(data, false, false);
        }
    }
}

export const startConsumer = async () => {
    try {
        const connection = await amqp.connect(appConfig.rabbitMqUrl as string);
        const channel = await connection.createChannel();

        await channel.assertQueue(QUEUES.PRODUCT_SYNC);
        await channel.assertQueue(QUEUES.PRODUCT_DELETE);

        console.log("Consumer started: Waiting for messages...");

        channel.consume(QUEUES.PRODUCT_SYNC, async (data) => {
            if (data) {
                const product: Product = JSON.parse(data.content.toString());
                
                // Create array of operations for all replicas
                const operations = readDBReplicas.map(db => 
                    db.product.upsert({
                        where: { id: product.id },
                        update: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            stock: product.stock,
                            updatedAt: product.updatedAt,
                        },
                        create: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            stock: product.stock,
                            createdAt: product.createdAt,
                            updatedAt: product.updatedAt,
                        },
                    }).then(() => {})
                );

                await processWithRetry(operations, channel, data);
                console.log(`Product ${product.id} upserted in all replicas`);
            }
        });

        channel.consume(QUEUES.PRODUCT_DELETE, async (data) => {
            if (data) {
                const productId = data.content.toString();
                
                // Create array of operations for all replicas
                const operations = readDBReplicas.map(db =>
                    db.product.delete({
                        where: { id: productId },
                    }).then(() => {})
                );

                await processWithRetry(operations, channel, data);
                console.log(`Product ${productId} deleted in all replicas`);
            }
        });

        channel.on("close", () => {
            console.log("Consumer closed");
        });
    } catch (error) {
        console.error("Error starting consumer:", error);
    }
};