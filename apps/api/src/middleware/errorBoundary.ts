import { Request, Response, NextFunction } from "express";

export function errorBoundary(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const statusCode = error.statusCode || 500;

    console.error("[ErrorBoundary] Caught error:", error);

    res.status(statusCode).json({
        success: false,
        error: {
            message: error.message || "Internal Server Error",
            code: error.name || "Error",
        },
    });
}
