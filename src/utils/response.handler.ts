import { Response } from 'express';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export const handleSuccess = <T>(res: Response, data: T, message?: string): void => {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message
    };
    res.json(response);
};

export const handleError = (res: Response, error: any): void => {
    if(error.code === 'P2025') {
        error.message = 'Product not found';
        error.statusCode = 404;
    }
    const response: ApiResponse<null> = {
        success: false,
        error: error.message || 'Internal server error'
    };
    res.status(error.statusCode || 500).json(response);
};