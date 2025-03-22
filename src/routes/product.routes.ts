import { Router } from "express";
import { getAllProductController, createProductController, deleteProductController } from "../controllers/product.controller";

const productRoutes = Router();

productRoutes.post("/", createProductController); 
productRoutes.get("/", getAllProductController);    
productRoutes.delete("/:id", deleteProductController); 

export default productRoutes;
