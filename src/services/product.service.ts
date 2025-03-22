import { Product } from "@prisma/client";
import { writeDB, readDB } from "./prisma.service";
import { replicateDataSyncUpsert, replicateDataDelete } from "../queue/rabitmq";

export const getProducts = async (): Promise<Product[]> => {
    return await readDB.product.findMany();
};

export const createProduct = async (productData: Product): Promise<Product> => {
    return await writeDB.$transaction(async (prismaClient) => {
        await replicateDataSyncUpsert(productData);
        const product = await prismaClient.product.upsert({
            where: { id: productData.id },
            update: productData,
            create: productData,
        });
        return product;
    });
};

export const deleteProduct = async (productId: string): Promise<void> => {
    await writeDB.$transaction(async (prismaClient) => {
        await replicateDataDelete(productId);
        await prismaClient.product.delete({
            where: { id: productId }
        });
    });
};