export class BaseError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly retryable: boolean;
    public readonly exchange?: string;

    constructor(message: string, status: number, code: string, retryable: boolean = false, exchange?: string) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.code = code;
        this.retryable = retryable;
        this.exchange = exchange;
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequest extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 400, 'BAD_REQUEST', false, exchange); }
}
export class AuthenticationError extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 401, 'AUTHENTICATION_ERROR', false, exchange); }
}
export class PermissionDenied extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 403, 'PERMISSION_DENIED', false, exchange); }
}
export class NotFound extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 404, 'NOT_FOUND', false, exchange); }
}
export class OrderNotFound extends BaseError {
    constructor(orderId: string, exchange?: string) { super(`Order not found: ${orderId}`, 404, 'ORDER_NOT_FOUND', false, exchange); }
}
export class MarketNotFound extends BaseError {
    constructor(marketId: string, exchange?: string) { super(`Market not found: ${marketId}`, 404, 'MARKET_NOT_FOUND', false, exchange); }
}
export class RateLimitExceeded extends BaseError {
    public readonly retryAfter?: number;
    constructor(message: string, retryAfter?: number, exchange?: string) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', true, exchange);
        this.retryAfter = retryAfter;
    }
}
export class InvalidOrder extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 400, 'INVALID_ORDER', false, exchange); }
}
export class InsufficientFunds extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 400, 'INSUFFICIENT_FUNDS', false, exchange); }
}
export class ValidationError extends BaseError {
    public readonly field?: string;
    constructor(message: string, field?: string, exchange?: string) {
        super(message, 400, 'VALIDATION_ERROR', false, exchange);
        this.field = field;
    }
}
export class NetworkError extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 503, 'NETWORK_ERROR', true, exchange); }
}
export class ExchangeNotAvailable extends BaseError {
    constructor(message: string, exchange?: string) { super(message, 503, 'EXCHANGE_NOT_AVAILABLE', true, exchange); }
}
