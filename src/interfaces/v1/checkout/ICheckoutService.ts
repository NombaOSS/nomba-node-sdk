/**
 * @module nomba/interfaces/checkout
 * @description Checkout service contract
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	ChargeTokenizedCardParams,
	ChargeTokenizedCardResult,
	CheckoutOrderCreated,
	CheckoutResult,
	CheckoutTransaction,
	CreateCheckoutOrderParams,
	FetchCheckoutTransactionParams,
	ListTokenizedCardsParams,
	RefundCheckoutTransactionParams,
	TokenizedCardData,
	TokenizedCardList,
	TokenizedCardResult,
	UpdatedTokenizedCard,
	UpdateTokenizedCardParams,
} from "../../../types/v1/checkout/checkout.types.js";

export interface ICheckoutService {
	/**
	 * `POST /v1/checkout/order`. Send the customer to `checkoutLink` to pay.
	 * Verified against a real sandbox call to use /v1/checkout/order, not /sandbox/checkout/order as the
	 * sandbox-testing guide claims (that path 404s); sandbox and production share this path.
	 * @param params The order to create; `order.orderReference` is the idempotency key.
	 * @returns The created order, including `checkoutLink`.
	 * @throws {NombaError} The call failed.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	createOrder(params: CreateCheckoutOrderParams): Promise<CheckoutOrderCreated>;
	/**
	 * `GET /v1/checkout/transaction`. Verified in sandbox; see the note on `createOrder`.
	 * @param params Which transaction to fetch, e.g. by `orderReference`.
	 * @returns The matching transaction.
	 * @throws {NombaError} The call failed, e.g. no transaction matches.
	 */
	fetchTransaction(
		params?: FetchCheckoutTransactionParams,
	): Promise<CheckoutTransaction>;
	/**
	 * `POST /v1/checkout/order/cancel`. Only for orders not yet paid; use `refund` after payment.
	 * @param orderReference The order's reference (used as idempotency key).
	 * @throws {NombaError} The call failed, e.g. the order was already paid.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	cancelOrder(orderReference: string): Promise<CheckoutResult>;
	/**
	 * `POST /v1/checkout/refund`. Verified in sandbox; see the note on `createOrder`.
	 * @param params The transaction to refund; `transactionId` is the idempotency key.
	 * @param options Outcome handlers (`onSuccess`, `onPending`, `onFailed`).
	 * @returns The refund result, or the outcome `options` maps it to.
	 * @throws {NombaError} The call failed and is not retryable.
	 * @throws {OutcomeUnknownError} The request outcome could not be determined and no `onPending` was supplied.
	 * @throws {UnconfirmedOutcomeError} The response was pending or undocumented and no `onPending` was supplied.
	 */
	refund<R = CheckoutResult>(
		params: RefundCheckoutTransactionParams,
		options?: CallOptions<CheckoutResult, R>,
	): Promise<CheckoutResult | R>;
	/**
	 * `POST /v1/checkout/tokenized-card-payment`. Check `status` on the result: it says whether the charge
	 * went through. If `otpRequired` is true, the charge is pending: call `ChargeService.submitCardOtp`
	 * with the returned `transactionId` and `orderReference`.
	 * @param params The tokenized card and amount to charge; `order.orderReference` is the idempotency key.
	 * @returns The charge result.
	 * @throws {NombaError} The call failed, e.g. the token is invalid or expired.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	chargeTokenizedCard(
		params: ChargeTokenizedCardParams,
	): Promise<ChargeTokenizedCardResult>;
	/**
	 * `GET /v1/checkout/tokenized-card-data`.
	 * @param params Pagination (`page`) and other list filters.
	 * @returns One page of the customer's saved, tokenized cards.
	 * @throws {NombaError} The call failed.
	 */
	listTokenizedCards(
		params?: ListTokenizedCardsParams,
	): Promise<TokenizedCardList>;
	/**
	 * Every tokenized card matching the filters, across all pages. Starts at `params.page` if given.
	 * @param params Starting page and other list filters.
	 * @throws {NombaError} A page request failed.
	 */
	iterateTokenizedCards(
		params?: ListTokenizedCardsParams,
	): AsyncGenerator<TokenizedCardData>;
	/**
	 * `POST /v1/checkout/tokenized-card-data`.
	 * @param params The tokenized card's key and the fields to update; `tokenKey` is the idempotency key.
	 * @returns The updated tokenized card.
	 * @throws {NombaError} The call failed, e.g. the token is invalid.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	updateTokenizedCard(
		params: UpdateTokenizedCardParams,
	): Promise<UpdatedTokenizedCard>;
	/**
	 * `DELETE /v1/checkout/tokenized-card-data`.
	 * @param tokenKey The tokenized card's key (used as idempotency key).
	 * @throws {NombaError} The call failed, e.g. the token is invalid.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	deleteTokenizedCard(tokenKey: string): Promise<TokenizedCardResult>;
}
