/**
 * @module nomba/interfaces/transfers
 * @description Transfers service contract
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	Bank,
	BankAccountLookupParams,
	BankAccountLookupResult,
	BankTransferParams,
	BankTransferResult,
	WalletTransferParams,
	WalletTransferResult,
} from "../../../types/v2/transfers/transfers.types.js";

export interface ITransfersService {
	/**
	 * `GET /v1/transfers/banks`. Lists the banks usable as a transfer destination.
	 * @returns The supported banks, each with its name and code.
	 * @throws {NombaError} A non-2xx response.
	 */
	listBanks(): Promise<Bank[]>;
	/**
	 * `POST /v1/transfers/bank/lookup`. Resolves a bank account number to its account name.
	 * @param params The bank code and account number to look up.
	 * @returns The resolved account name.
	 * @throws {NombaError} The lookup was rejected, e.g. an invalid account number.
	 */
	lookupBankAccount(
		params: BankAccountLookupParams,
	): Promise<BankAccountLookupResult>;
	/**
	 * `POST /v2/transfers/bank`. Sends a bank transfer from the parent account.
	 * @param params The destination bank, account number and amount, and the `merchantTxRef` used for
	 * idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	bankTransfer<R = BankTransferResult>(
		params: BankTransferParams,
		options?: CallOptions<BankTransferResult, R>,
	): Promise<BankTransferResult | R>;
	/**
	 * `POST /v2/transfers/bank/{subAccountId}`. Sends a bank transfer from a sub account. You must ask
	 * Nomba to profile you for sub account transfers.
	 * @param subAccountId The sub account to transfer from.
	 * @param params The destination bank, account number and amount, and the `merchantTxRef` used for
	 * idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	bankTransferFromSubAccount<R = BankTransferResult>(
		subAccountId: string,
		params: BankTransferParams,
		options?: CallOptions<BankTransferResult, R>,
	): Promise<BankTransferResult | R>;
	/**
	 * `POST /v2/transfers/wallet`. Sends a wallet-to-wallet transfer from the parent account to another
	 * Nomba account.
	 * @param params The destination wallet and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	walletTransfer<R = WalletTransferResult>(
		params: WalletTransferParams,
		options?: CallOptions<WalletTransferResult, R>,
	): Promise<WalletTransferResult | R>;
	/**
	 * `POST /v2/transfers/wallet/{subAccountId}`. Sends a wallet-to-wallet transfer from a sub account.
	 * @param subAccountId The sub account to transfer from.
	 * @param params The destination wallet and amount, and the `merchantTxRef` used for idempotency.
	 * @param options Outcome closures and per-call overrides; without them, success resolves the result and
	 * a rejection or pending outcome throws.
	 * @returns The transfer result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The transfer was rejected (4xx) and never happened.
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	walletTransferFromSubAccount<R = WalletTransferResult>(
		subAccountId: string,
		params: WalletTransferParams,
		options?: CallOptions<WalletTransferResult, R>,
	): Promise<WalletTransferResult | R>;
}
