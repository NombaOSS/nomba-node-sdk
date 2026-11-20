/**
 * @module nomba/checkout
 * @description Nomba SDK for Node.js
 * @author Nomba Financial Services
 * @version 1.0.0
 * @description Checkout resource
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/checkout
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { ICheckoutService } from "../../../interfaces/v1/checkout/ICheckoutService.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { paginate } from "../../../lib/paginate.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
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

// The refund endpoint documents code "00" and a `success` boolean in data. The docs don't say `false` is final, so
// it is pending (requery before refunding again), like Global Payout's FAILED.
const REFUND_OUTCOMES: OutcomeTable = {
	codes: { "00": "success", ...REJECTED },
	statuses: { true: "success", false: "pending" },
	statusOf: (data) => {
		const ok = (data as { success?: unknown } | null)?.success;
		return typeof ok === "boolean" ? String(ok) : undefined;
	},
};

export class CheckoutService implements ICheckoutService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `POST /v1/checkout/order`. Send the customer to `checkoutLink` to pay.
	 * Verified against a real sandbox call to use /v1/checkout/order, not /sandbox/checkout/order as the
	 * sandbox-testing guide claims (that path 404s); sandbox and production share this path.
	 * @param params The order to create; `order.orderReference` is the idempotency key when provided.
	 * @returns The created order, including `checkoutLink`.
	 * @throws {NombaError} The call failed.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	createOrder(
		params: CreateCheckoutOrderParams,
	): Promise<CheckoutOrderCreated> {
		const ref = params.order.orderReference;
		return this.http.request("POST", "/v1/checkout/order", {
			body: params,
			...(ref ? { idempotencyKey: ref } : {}),
		});
	}

	/**
	 * `GET /v1/checkout/transaction`. Verified in sandbox; see the note on `createOrder`.
	 * @param params Which transaction to fetch, e.g. by `orderReference`.
	 * @returns The matching transaction.
	 * @throws {NombaError} The call failed, e.g. no transaction matches.
	 */
	fetchTransaction(
		params: FetchCheckoutTransactionParams = {},
	): Promise<CheckoutTransaction> {
		return this.http.request("GET", "/v1/checkout/transaction", {
			query: params,
		});
	}

	/**
	 * `POST /v1/checkout/order/cancel`. Only for orders not yet paid; use `refund` after payment.
	 * @param orderReference The order's reference (used as idempotency key).
	 * @throws {NombaError} The call failed, e.g. the order was already paid.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	cancelOrder(orderReference: string): Promise<CheckoutResult> {
		return this.http.request("POST", "/v1/checkout/order/cancel", {
			body: { orderReference },
			idempotencyKey: orderReference,
		});
	}

	/**
	 * `POST /v1/checkout/refund`. Verified in sandbox; see the note on `createOrder`.
	 * @param params The transaction to refund; `transactionId` is the idempotency key.
	 * @param options Outcome polling/mapping and other per-call overrides.
	 * @returns The refund result, or the outcome `options` maps it to.
	 * @throws {NombaError} The call failed and is not retryable.
	 * @throws {UnconfirmedOutcomeError} The outcome stayed pending after polling ran out.
	 */
	async refund<R = CheckoutResult>(
		params: RefundCheckoutTransactionParams,
		options: CallOptions<CheckoutResult, R> = {},
	): Promise<CheckoutResult | R> {
		return settle(
			this.http,
			"POST",
			"/v1/checkout/refund",
			{ body: params },
			REFUND_OUTCOMES,
			{ field: "transactionId", value: params.transactionId },
			options,
		);
	}

	/**
	 * `POST /v1/checkout/tokenized-card-payment`. Check `status` on the result: it says whether the charge
	 * went through. If `otpRequired` is true, the charge is pending: call `ChargeService.submitCardOtp`
	 * with the returned `transactionId` and `orderReference`.
	 * @param params The tokenized card and amount to charge; `order.orderReference` is the idempotency key when provided.
	 * @returns The charge result.
	 * @throws {NombaError} The call failed, e.g. the token is invalid or expired.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	chargeTokenizedCard(
		params: ChargeTokenizedCardParams,
	): Promise<ChargeTokenizedCardResult> {
		const ref = params.order?.orderReference;
		return this.http.request("POST", "/v1/checkout/tokenized-card-payment", {
			body: params,
			...(ref ? { idempotencyKey: ref } : {}),
		});
	}

	/**
	 * `GET /v1/checkout/tokenized-card-data`.
	 * @param params Pagination (`page`) and other list filters.
	 * @returns One page of the customer's saved, tokenized cards.
	 * @throws {NombaError} The call failed.
	 */
	listTokenizedCards(
		params: ListTokenizedCardsParams = {},
	): Promise<TokenizedCardList> {
		return this.http.request("GET", "/v1/checkout/tokenized-card-data", {
			query: params,
		});
	}

	/**
	 * Every tokenized card matching the filters, across all pages. Starts at `params.page` if given.
	 * @param params Starting page and other list filters.
	 * @throws {NombaError} A page request failed.
	 */
	iterateTokenizedCards(
		params: ListTokenizedCardsParams = {},
	): AsyncGenerator<TokenizedCardData> {
		return paginate(async (cursor) => {
			const r = await this.listTokenizedCards(
				cursor ? { ...params, page: Number(cursor) } : params,
			);
			// nextPage is "0" when there are no more pages.
			const next = r.nextPage && r.nextPage !== "0" ? r.nextPage : "";
			return { results: r.tokenizedCardDataList ?? [], cursor: next };
		});
	}

	/**
	 * `POST /v1/checkout/tokenized-card-data`.
	 * @param params The tokenized card's key and the fields to update; `tokenKey` is the idempotency key.
	 * @returns The updated tokenized card.
	 * @throws {NombaError} The call failed, e.g. the token is invalid.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	updateTokenizedCard(
		params: UpdateTokenizedCardParams,
	): Promise<UpdatedTokenizedCard> {
		return this.http.request("POST", "/v1/checkout/tokenized-card-data", {
			body: params,
			idempotencyKey: params.tokenKey,
		});
	}

	/**
	 * `DELETE /v1/checkout/tokenized-card-data`.
	 * @param tokenKey The tokenized card's key (used as idempotency key).
	 * @throws {NombaError} The call failed, e.g. the token is invalid.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	deleteTokenizedCard(tokenKey: string): Promise<TokenizedCardResult> {
		return this.http.request("DELETE", "/v1/checkout/tokenized-card-data", {
			body: { tokenKey },
			idempotencyKey: tokenKey,
		});
	}
}
