import { Request, Response } from "express";
import { getProducts, createProduct, deleteProduct } from "../services/product.service";
import { handleSuccess, handleError } from "../utils/response.handler";

export const getAllProductController = async (_req: Request, res: Response) => {
    try {
        const products = await getProducts();
        handleSuccess(res, products, 'Products retrieved successfully');
    } catch (error) {
        handleError(res, error);
    }
};

export const createProductController = async (req: Request, res: Response) => {
    try {
        const product = await createProduct(req.body);
        handleSuccess(res, product, 'Product created successfully');
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteProductController = async (req: Request, res: Response) => {
    try {
        await deleteProduct(req.params.id);
        handleSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
        handleError(res, error);
    }
};