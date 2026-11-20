/**
 * @module nomba/services/v2/transfers
 * @description Transfers (v2): POST /v2/transfers[/{subAccountId}]/*
 * @see https://developer.nomba.com/docs/api-reference/transfers
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { ITransfersService } from "../../../interfaces/v2/transfers/ITransfersService.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { pathId } from "../../../lib/util.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
import type {
	Bank,
	BankAccountLookupParams,
	BankAccountLookupResult,
	BankTransferParams,
	BankTransferResult,
	WalletTransferParams,
	WalletTransferResult,
} from "../../../types/v2/transfers/transfers.types.js";

// Documented for every transfer endpoint: code "200" done, "201" accepted and still processing; data.status
// SUCCESS or PENDING_BILLING. The docs say to treat any other status as pending, so it is never success or
// failed: it reaches onPending, or throws UnconfirmedOutcomeError when no onPending is passed. That includes
// REFUND and the other requery statuses, which this endpoint does not document.
const TRANSFER_OUTCOMES: OutcomeTable = {
	codes: { "00": "success", "200": "success", "201": "pending", ...REJECTED },
	statuses: { SUCCESS: "success", PENDING_BILLING: "pending" },
};

/**
 * Money movement. A call that throws a NombaError with a 4xx status was rejected and did nothing. Any other
 * failure (5xx, network error, timeout) leaves the outcome unknown: keep the same `merchantTxRef`, wait for the
 * webhook or requery, and never send the transfer again under a new reference.
 */
export class TransfersService implements ITransfersService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `GET /v1/transfers/banks`. Lists the banks usable as a transfer destination.
	 * @returns The supported banks, each with its name and code.
	 * @throws {NombaError} A non-2xx response.
	 */
	listBanks(): Promise<Bank[]> {
		return this.http.request("GET", "/v1/transfers/banks");
	}

	/**
	 * `POST /v1/transfers/bank/lookup`. Resolves a bank account number to its account name.
	 * @param params The bank code and account number to look up.
	 * @returns The resolved account name.
	 * @throws {NombaError} The lookup was rejected, e.g. an invalid account number.
	 */
	lookupBankAccount(
		params: BankAccountLookupParams,
	): Promise<BankAccountLookupResult> {
		return this.http.request("POST", "/v1/transfers/bank/lookup", {
			body: params,
		});
	}

	/**
	 * `POST /v2/transfers/bank`. Sends a bank transfer from the parent account.
	 * @param params The destination bank, account number and amount; `merchantTxRef` is the idempotency key.
	 * @param options Outcome closures; without them, success resolves the result and pending/failure throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async bankTransfer<R = BankTransferResult>(
		params: BankTransferParams,
		options: CallOptions<BankTransferResult, R> = {},
	): Promise<BankTransferResult | R> {
		return settle(
			this.http,
			"POST",
			"/v2/transfers/bank",
			{ body: params },
			TRANSFER_OUTCOMES,
			{ field: "merchantTxRef", value: params.merchantTxRef },
			options,
		);
	}

	/**
	 * `POST /v2/transfers/bank/{subAccountId}`. Sends a bank transfer from a sub account. You must ask
	 * Nomba to profile you for sub account transfers.
	 * @param subAccountId The sub account to transfer from.
	 * @param params The destination bank, account number and amount; `merchantTxRef` is the idempotency key.
	 * @param options Outcome closures; without them, success resolves the result and pending/failure throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async bankTransferFromSubAccount<R = BankTransferResult>(
		subAccountId: string,
		params: BankTransferParams,
		options: CallOptions<BankTransferResult, R> = {},
	): Promise<BankTransferResult | R> {
		return settle(
			this.http,
			"POST",
			`/v2/transfers/bank/${pathId(subAccountId)}`,
			{ body: params },
			TRANSFER_OUTCOMES,
			{ field: "merchantTxRef", value: params.merchantTxRef },
			options,
		);
	}

	/**
	 * `POST /v2/transfers/wallet`. Sends a wallet-to-wallet transfer from the parent account to another
	 * Nomba account.
	 * @param params The destination wallet and amount; `merchantTxRef` is the idempotency key.
	 * @param options Outcome closures; without them, success resolves the result and pending/failure throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async walletTransfer<R = WalletTransferResult>(
		params: WalletTransferParams,
		options: CallOptions<WalletTransferResult, R> = {},
	): Promise<WalletTransferResult | R> {
		return settle(
			this.http,
			"POST",
			"/v2/transfers/wallet",
			{ body: params },
			TRANSFER_OUTCOMES,
			{ field: "merchantTxRef", value: params.merchantTxRef },
			options,
		);
	}

	/**
	 * `POST /v2/transfers/wallet/{subAccountId}`. Sends a wallet-to-wallet transfer from a sub account.
	 * @param subAccountId The sub account to transfer from.
	 * @param params The destination wallet and amount; `merchantTxRef` is the idempotency key.
	 * @param options Outcome closures; without them, success resolves the result and pending/failure throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async walletTransferFromSubAccount<R = WalletTransferResult>(
		subAccountId: string,
		params: WalletTransferParams,
		options: CallOptions<WalletTransferResult, R> = {},
	): Promise<WalletTransferResult | R> {
		return settle(
			this.http,
			"POST",
			`/v2/transfers/wallet/${pathId(subAccountId)}`,
			{ body: params },
			TRANSFER_OUTCOMES,
			{ field: "merchantTxRef", value: params.merchantTxRef },
			options,
		);
	}
}
