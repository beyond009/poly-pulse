import axios from 'axios';
import { ErrorMapper } from '../utils/error-mapper';
import { AuthenticationError, BaseError, ExchangeNotAvailable, InvalidOrder, BadRequest, PermissionDenied } from '../errors';

export class PolymarketErrorMapper extends ErrorMapper {
    constructor() { super('Polymarket'); }

    protected extractErrorMessage(error: unknown): string {
        if (axios.isAxiosError(error) && error.response?.data) {
            const data = error.response.data;
            if (typeof data.error === 'string') return data.error;
            if (data.errorMsg) return data.errorMsg;
        }
        return super.extractErrorMessage(error);
    }

    protected mapByStatusCode(status: number, message: string, data: unknown, response?: unknown): BaseError {
        if (status === 425) return new ExchangeNotAvailable(`Matching engine restarting: ${message}`, this.exchangeName);
        return super.mapByStatusCode(status, message, data, response);
    }

    protected mapBadRequestError(message: string, data: unknown): BadRequest {
        const m = message.toLowerCase();
        if (m.includes('maker address not allowed') || m.includes('deposit wallet')) {
            return new AuthenticationError(`${message}. Check signature_type setting.`, this.exchangeName);
        }
        if (m.includes('api key') || m.includes('proxy') || m.includes('signature type')) {
            return new AuthenticationError(message, this.exchangeName);
        }
        if (m.includes('trading is currently disabled') || m.includes('cancel-only')) {
            return new ExchangeNotAvailable(message, this.exchangeName);
        }
        if (m.includes('address banned') || m.includes('closed only mode')) {
            return new PermissionDenied(message, this.exchangeName);
        }
        if (m.includes('tick size') || m.includes('post-only order') || m.includes('fok order')) {
            return new InvalidOrder(message, this.exchangeName);
        }
        return super.mapBadRequestError(message, data);
    }
}

export const polymarketErrorMapper = new PolymarketErrorMapper();
