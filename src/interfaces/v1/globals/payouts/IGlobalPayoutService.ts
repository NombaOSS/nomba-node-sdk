/**
 * @module nomba/interfaces/global-payout
 * @description GlobalPayout service contract
 */

import type { CallOptions } from "../../../../types/common/common.types.js";
import type {
	AuthorizeExchangeParams,
	AuthorizeTransferParams,
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
} from "../../../../types/v1/globals/payout.types.js";

export interface IGlobalPayoutService {
	/**
	 * `GET /v1/global-payout/accounts`.
	 * @returns Every currency wallet, with its balance.
	 * @throws {NombaError} The request failed.
	 */
	listAccounts(): Promise<PayoutAccount[]>;
	/**
	 * `GET /v1/global-payout/accounts/{accountId}`.
	 * @param accountId The wallet to look up.
	 * @returns The wallet's details and balance.
	 * @throws {NombaError} `accountId` is not one of your wallets (404), or the request failed.
	 */
	getAccount(accountId: string): Promise<PayoutAccount>;
	/**
	 * `GET /v1/sandbox/global-payout/accounts`.
	 * @returns Canned test wallet data.
	 * @throws {NombaError} The request failed.
	 */
	listSandboxAccounts(): Promise<PayoutAccount[]>;
	/**
	 * `GET /v1/sandbox/global-payout/accounts/{accountId}`. Canned test data; any id is echoed back.
	 * @param accountId The wallet id to echo back in the canned response.
	 * @returns Canned test wallet data for that id.
	 * @throws {NombaError} The request failed.
	 */
	getSandboxAccount(accountId: string): Promise<PayoutAccount>;
	/**
	 * `GET /v1/global-payout/exchange-rates`.
	 * @param params The currency pair to get a rate for.
	 * @returns The matching exchange rates.
	 * @throws {NombaError} The request failed.
	 */
	exchangeRates(params: ExchangeRatesParams): Promise<ExchangeRate[]>;
	/**
	 * `POST /v1/global-payout/money/convert`. A calculation only; no money moves.
	 * @param params The amount and currency pair to convert.
	 * @returns The converted amount and rate used.
	 * @throws {NombaError} The request failed.
	 */
	convert(params: ConvertMoneyParams): Promise<Conversion>;
	/**
	 * `GET /v1/global-payout/bank/providers`.
	 * @param params Filters, e.g. by country or currency.
	 * @returns The receiving institutions available for payout.
	 * @throws {NombaError} The request failed.
	 */
	institutionProviders(
		params?: InstitutionProvidersParams,
	): Promise<InstitutionProvider[]>;
	/**
	 * `GET /v1/global-payout/payment-methods`.
	 * @param params Filters, e.g. by country or currency.
	 * @returns The payment methods available for payout.
	 * @throws {NombaError} The request failed.
	 */
	paymentMethods(params?: PaymentMethodsParams): Promise<PaymentMethodInfo[]>;
	/**
	 * `POST /v1/global-payout/transfer/authorize`. Sends money cross-border.
	 * @param params The transfer to authorize. Must include `idempotencyKey` — the SDK never generates
	 * one for you to prevent double disbursement.
	 * @param options Outcome closures (`onSuccess`, `onPending`, `onFailed`).
	 * @returns The settled payout result (or the type `options` maps it to).
	 * @throws {IdempotencyKeyAbsentError} `idempotencyKey` is missing or empty.
	 * @throws {NombaError} The transfer was rejected.
	 * @throws {OutcomeUnknownError} The request outcome could not be determined and no `onPending` was supplied.
	 * @throws {UnconfirmedOutcomeError} The response was pending or undocumented and no `onPending` was supplied.
	 */
	authorizeTransfer<R = PayoutResult>(
		params: AuthorizeTransferParams,
		options?: CallOptions<PayoutResult, R>,
	): Promise<PayoutResult | R>;
	/**
	 * `POST /v1/global-payout/exchange/authorize`. Moves money between your own wallets in different currencies.
	 * @param params The exchange to authorize. Must include `idempotencyKey` — the SDK never generates
	 * one for you to prevent double disbursement.
	 * @param options Outcome closures (`onSuccess`, `onPending`, `onFailed`).
	 * @returns The settled payout result (or the type `options` maps it to).
	 * @throws {IdempotencyKeyAbsentError} `idempotencyKey` is missing or empty.
	 * @throws {NombaError} The exchange was rejected.
	 * @throws {OutcomeUnknownError} The request outcome could not be determined and no `onPending` was supplied.
	 * @throws {UnconfirmedOutcomeError} The response was pending or undocumented and no `onPending` was supplied.
	 */
	authorizeExchange<R = PayoutResult>(
		params: AuthorizeExchangeParams,
		options?: CallOptions<PayoutResult, R>,
	): Promise<PayoutResult | R>;
	/**
	 * `GET /v1/global-payout/transactions/{transactionId}`, with a `wtTransactionId`.
	 * @param transactionId The transaction to look up.
	 * @returns The transaction's current state.
	 * @throws {NombaError} `transactionId` is not found, or the request failed.
	 */
	getTransaction(transactionId: string): Promise<PayoutTransaction>;
}
