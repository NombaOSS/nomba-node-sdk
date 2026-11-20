/**
 * @module nomba/globals/payouts
 * @description Nomba SDK for Node.js
 * @description Cross-border transfers and currency exchange resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/products/global-payout/introduction
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IGlobalPayoutService } from "../../../interfaces/v1/globals/payouts/IGlobalPayoutService.js";
import { IdempotencyKeyAbsentError } from "../../../lib/errors.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { pathId } from "../../../lib/util.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
import type {
	AuthorizeExchangeParams,
	AuthorizeTransferParams,
	BodyIdempotencyKey,
	Conversion,
	ConvertMoneyParams,
	ExchangeRate,
	ExchangeRatesParams,
	InstitutionProvider,
	InstitutionProvidersParams,
	PaymentMethodInfo,
	PaymentMethodsParams,
	PayoutAccount,
	PayoutResult,
	PayoutTransaction,
} from "../../../types/v1/globals/payout.types.js";

// authorize-transfer documents data.status PROCESSING, PENDING, COMPLETED and FAILED. The docs never say FAILED is
// final or safe to refund, so it stays pending until confirmed; only COMPLETED is success.
const TRANSFER_OUTCOMES: OutcomeTable = {
	codes: { "00": "success", ...REJECTED },
	statuses: {
		COMPLETED: "success",
		PROCESSING: "pending",
		PENDING: "pending",
		FAILED: "pending",
	},
};

// authorize-exchange documents no status values (examples only), so it is classified by code alone.
const EXCHANGE_OUTCOMES: OutcomeTable = {
	codes: { "00": "success", ...REJECTED },
};

/** Global Payout (v1): cross-border transfers, currency exchange, and multi-currency wallets. */
export class GlobalPayoutService implements IGlobalPayoutService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/global-payout/accounts`.
	 * @returns Every currency wallet, with its balance.
	 * @throws {NombaError} The request failed.
	 */
	listAccounts(): Promise<PayoutAccount[]> {
		return this.http.request("GET", "/v1/global-payout/accounts");
	}

	/**
	 * `GET /v1/global-payout/accounts/{accountId}`.
	 * @param accountId The wallet to look up.
	 * @returns The wallet's details and balance.
	 * @throws {NombaError} `accountId` is not one of your wallets (404), or the request failed.
	 */
	async getAccount(accountId: string): Promise<PayoutAccount> {
		return this.http.request(
			"GET",
			`/v1/global-payout/accounts/${pathId(accountId)}`,
		);
	}

	/**
	 * `GET /v1/sandbox/global-payout/accounts`.
	 * @returns Canned test wallet data.
	 * @throws {NombaError} The request failed.
	 */
	listSandboxAccounts(): Promise<PayoutAccount[]> {
		return this.http.request("GET", "/v1/sandbox/global-payout/accounts");
	}

	/**
	 * `GET /v1/sandbox/global-payout/accounts/{accountId}`. Canned test data; any id is echoed back.
	 * @param accountId The wallet id to echo back in the canned response.
	 * @returns Canned test wallet data for that id.
	 * @throws {NombaError} The request failed.
	 */
	async getSandboxAccount(accountId: string): Promise<PayoutAccount> {
		return this.http.request(
			"GET",
			`/v1/sandbox/global-payout/accounts/${pathId(accountId)}`,
		);
	}

	/**
	 * `GET /v1/global-payout/exchange-rates`.
	 * @param params The currency pair to get a rate for.
	 * @returns The matching exchange rates.
	 * @throws {NombaError} The request failed.
	 */
	async exchangeRates(params: ExchangeRatesParams): Promise<ExchangeRate[]> {
		const data = await this.http.request<{ rates: ExchangeRate[] }>(
			"GET",
			"/v1/global-payout/exchange-rates",
			{ query: params },
		);
		return data.rates;
	}

	/**
	 * `POST /v1/global-payout/money/convert`. A calculation only; no money moves.
	 * @param params The amount and currency pair to convert.
	 * @returns The converted amount and rate used.
	 * @throws {NombaError} The request failed.
	 */
	convert(params: ConvertMoneyParams): Promise<Conversion> {
		return this.http.request("POST", "/v1/global-payout/money/convert", {
			body: params,
		});
	}

	/**
	 * `GET /v1/global-payout/bank/providers`.
	 * @param params Filters, e.g. by country or currency.
	 * @returns The receiving institutions available for payout.
	 * @throws {NombaError} The request failed.
	 */
	institutionProviders(
		params: InstitutionProvidersParams = {},
	): Promise<InstitutionProvider[]> {
		return this.http.request("GET", "/v1/global-payout/bank/providers", {
			query: params,
		});
	}

	/**
	 * `GET /v1/global-payout/payment-methods`.
	 * @param params Filters, e.g. by country or currency.
	 * @returns The payment methods available for payout.
	 * @throws {NombaError} The request failed.
	 */
	paymentMethods(
		params: PaymentMethodsParams = {},
	): Promise<PaymentMethodInfo[]> {
		return this.http.request("GET", "/v1/global-payout/payment-methods", {
			query: params,
		});
	}

	/**
	 * `POST /v1/global-payout/transfer/authorize`. Sends money cross-border.
	 * @param params The transfer to authorize. Must include `idempotencyKey` — the SDK never generates
	 * one for you to prevent double disbursement.
	 * @param options Per-call overrides including outcome closures (`onSuccess`, `onPending`, `onFailed`).
	 * @returns The settled payout result (or the type `options` maps it to).
	 * @throws {IdempotencyKeyAbsentError} `idempotencyKey` is missing or empty.
	 * @throws {NombaError} The transfer was rejected.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed;
	 * check the transaction status before retrying (not thrown if `options` resolves unknown outcomes).
	 */
	async authorizeTransfer<R = PayoutResult>(
		params: AuthorizeTransferParams,
		options: CallOptions<PayoutResult, R> = {},
	): Promise<PayoutResult | R> {
		return this.#authorize(
			"/v1/global-payout/transfer/authorize",
			params,
			options,
			TRANSFER_OUTCOMES,
		);
	}

	/**
	 * `POST /v1/global-payout/exchange/authorize`. Moves money between your own wallets in different currencies.
	 * @param params The exchange to authorize. Must include `idempotencyKey` — the SDK never generates
	 * one for you to prevent double disbursement.
	 * @param options Per-call overrides including outcome closures (`onSuccess`, `onPending`, `onFailed`).
	 * @returns The settled payout result (or the type `options` maps it to).
	 * @throws {IdempotencyKeyAbsentError} `idempotencyKey` is missing or empty.
	 * @throws {NombaError} The exchange was rejected.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed;
	 * check the transaction status before retrying (not thrown if `options` resolves unknown outcomes).
	 */
	async authorizeExchange<R = PayoutResult>(
		params: AuthorizeExchangeParams,
		options: CallOptions<PayoutResult, R> = {},
	): Promise<PayoutResult | R> {
		return this.#authorize(
			"/v1/global-payout/exchange/authorize",
			params,
			options,
			EXCHANGE_OUTCOMES,
		);
	}

	/**
	 * `GET /v1/global-payout/transactions/{transactionId}`, with a `wtTransactionId`.
	 * @param transactionId The transaction to look up.
	 * @returns The transaction's current state.
	 * @throws {NombaError} `transactionId` is not found, or the request failed.
	 */
	async getTransaction(transactionId: string): Promise<PayoutTransaction> {
		return this.http.request(
			"GET",
			`/v1/global-payout/transactions/${pathId(transactionId)}`,
		);
	}

	// One key in the body (the one the API dedupes on), required to prevent double disbursement; OutcomeUnknownError reports it.
	#authorize<R>(
		path: string,
		params: BodyIdempotencyKey,
		options: CallOptions<PayoutResult, R>,
		table: OutcomeTable,
	): Promise<PayoutResult | R> {
		const { idempotencyKey } = params;
		if (!idempotencyKey?.trim()) {
			throw new IdempotencyKeyAbsentError("idempotencyKey", path);
		}
		return settle(
			this.http,
			"POST",
			path,
			{ body: params },
			table,
			{ field: "idempotencyKey", value: idempotencyKey },
			options,
		);
	}
}
