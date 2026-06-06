import axios, { AxiosError } from 'axios';
import {
    BaseError, BadRequest, AuthenticationError, PermissionDenied, NotFound,
    OrderNotFound, MarketNotFound, RateLimitExceeded, InvalidOrder,
    InsufficientFunds, ValidationError, NetworkError, ExchangeNotAvailable,
} from '../errors';

interface PlainErrorObject {
    readonly status: number;
    readonly data?: unknown;
    readonly statusText?: string;
    readonly message?: string;
}

function isPlainErrorObject(value: unknown): value is PlainErrorObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value) &&
        !(value instanceof Error) && 'status' in value &&
        typeof (value as PlainErrorObject).status === 'number';
}

interface ErrorWithHttpMetadata extends Error {
    readonly status?: number;
    readonly statusCode?: number;
    readonly data?: unknown;
    readonly response?: { readonly status?: number; readonly statusCode?: number; readonly data?: unknown; readonly body?: unknown; readonly headers?: Record<string, string>; };
}

interface NodeError extends Error { readonly code?: string; }
function isNodeError(value: unknown): value is NodeError {
    return value instanceof Error && 'code' in value;
}

export class ErrorMapper {
    protected exchangeName?: string;
    constructor(exchangeName?: string) { this.exchangeName = exchangeName; }

    mapError(error: unknown): BaseError {
        if (error instanceof BaseError) {
            if (!error.exchange && this.exchangeName) {
                return new (error.constructor as new (...args: unknown[]) => BaseError)(error.message, this.exchangeName);
            }
            return error;
        }
        if (axios.isAxiosError(error)) return this.mapAxiosError(error);
        if (isPlainErrorObject(error)) {
            const message = this.extractErrorMessage(error);
            return this.mapByStatusCode(error.status, message, error.data, error);
        }
        if (isNodeError(error)) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                return new NetworkError(`Network error: ${error.message}`, this.exchangeName);
            }
        }
        if (error instanceof Error) {
            const err = error as ErrorWithHttpMetadata;
            const status = err.status ?? err.statusCode ?? err.response?.status ?? err.response?.statusCode;
            if (typeof status === 'number') {
                const message = this.extractErrorMessage(error);
                const data = err.data ?? err.response?.data ?? err.response?.body;
                return this.mapByStatusCode(status, message, data, err.response);
            }
        }
        const message = this.extractErrorMessage(error);
        return new BadRequest(message, this.exchangeName);
    }

    protected mapAxiosError(error: AxiosError): BaseError {
        const status = error.response?.status;
        const message = this.extractErrorMessage(error);
        const data = error.response?.data;
        if (!status) {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                return new NetworkError(`Request timeout: ${message}`, this.exchangeName);
            }
            return new ExchangeNotAvailable(`Exchange unreachable: ${message}`, this.exchangeName);
        }
        return this.mapByStatusCode(status, message, data, error.response);
    }

    protected mapByStatusCode(status: number, message: string, data: unknown, _response?: unknown): BaseError {
        switch (status) {
            case 400: return this.mapBadRequestError(message, data);
            case 401: return new AuthenticationError(message, this.exchangeName);
            case 403: return new PermissionDenied(message, this.exchangeName);
            case 404: return this.mapNotFoundError(message, data);
            case 429: return this.mapRateLimitError(message, _response);
            case 500: case 502: case 503: case 504:
                return new ExchangeNotAvailable(`Exchange error (${status}): ${message}`, this.exchangeName);
            default: return new BadRequest(`HTTP ${status}: ${message}`, this.exchangeName);
        }
    }

    protected mapBadRequestError(message: string, _data: unknown): BadRequest {
        const m = message.toLowerCase();
        if (m.includes('insufficient') || m.includes('balance') || m.includes('not enough')) return new InsufficientFunds(message, this.exchangeName);
        if (m.includes('invalid order') || m.includes('tick size') || m.includes('price must be') || m.includes('size must be')) return new InvalidOrder(message, this.exchangeName);
        if (m.includes('validation') || m.includes('invalid parameter')) return new ValidationError(message, undefined, this.exchangeName);
        return new BadRequest(message, this.exchangeName);
    }

    protected mapNotFoundError(message: string, _data: unknown): NotFound {
        const m = message.toLowerCase();
        if (m.includes('order') && !m.includes('order book')) {
            const match = message.match(/order[:\s]+([a-zA-Z0-9-]+)/i);
            return new OrderNotFound(match ? match[1] : 'unknown', this.exchangeName);
        }
        if (m.includes('market')) {
            const match = message.match(/market[:\s]+([a-zA-Z0-9-]+)/i);
            return new MarketNotFound(match ? match[1] : 'unknown', this.exchangeName);
        }
        return new NotFound(message, this.exchangeName);
    }

    protected mapRateLimitError(message: string, response: unknown): RateLimitExceeded {
        const headers = (typeof response === 'object' && response !== null && 'headers' in response
            ? (response as { headers?: Record<string, string> }).headers : undefined);
        const retryAfter = headers?.['retry-after'];
        return new RateLimitExceeded(message, retryAfter ? parseInt(retryAfter, 10) : undefined, this.exchangeName);
    }

    protected extractErrorMessage(error: unknown): string {
        if (axios.isAxiosError(error) && error.response?.data) {
            const data: unknown = error.response.data;
            if (typeof data === 'string') return data;
            if (typeof data === 'object' && data !== null) {
                const obj = data as Record<string, unknown>;
                if (typeof obj.error === 'string') return obj.error;
                if (typeof obj.message === 'string') return obj.message;
                if (typeof obj.errorMsg === 'string') return obj.errorMsg;
            }
            return JSON.stringify(data);
        }
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        try { return JSON.stringify(error, Object.getOwnPropertyNames(error)); } catch { return String(error); }
    }
}
