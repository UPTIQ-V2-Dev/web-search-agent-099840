export class ApiError extends Error {
    public statusCode: number;
    public code?: string;
    public details?: any;
    public isOperational: boolean;

    constructor(message: string, code?: string, statusCode = 500, details?: any, isOperational = true, stack = '') {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export const createApiError = (message: string, code?: string, statusCode = 500, details?: any): ApiError => {
    return new ApiError(message, code, statusCode, details);
};
