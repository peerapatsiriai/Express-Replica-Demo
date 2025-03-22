import amqp from "amqplib";
import appConfig from "../appConfig";
import { Product } from "@prisma/client";
import { QUEUES } from "../dto/queue.dto"

export const replicateDataSyncUpsert = async (product: Product) => {
    const connection = await amqp.connect(appConfig.rabbitMqUrl as string);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUES.PRODUCT_SYNC);
    channel.sendToQueue(QUEUES.PRODUCT_SYNC, Buffer.from(JSON.stringify(product)));
    await channel.close();
    await connection.close();
};

export const replicateDataDelete = async (productId: string) => {
    const connection = await amqp.connect(appConfig.rabbitMqUrl as string);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUES.PRODUCT_DELETE);
    channel.sendToQueue(QUEUES.PRODUCT_DELETE, Buffer.from(productId));
    await channel.close();
    await connection.close();
}