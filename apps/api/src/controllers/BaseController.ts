import { Response } from "express";

export abstract class BaseController {
    protected handleError(
        error: unknown,
        res: Response,
        context: string,
        statusCode = 500
    ): void {
        console.error(`[${this.constructor.name}] Error in ${context}:`, error);

        res.status(statusCode).json({
            success: false,
            error: {
                message: error instanceof Error ? error.message : "An error occurred",
                code: statusCode,
            },
        });
    }

    protected handleSuccess<T>(
        res: Response,
        data: T,
        message?: string,
        statusCode = 200
    ): void {
        res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }
}
