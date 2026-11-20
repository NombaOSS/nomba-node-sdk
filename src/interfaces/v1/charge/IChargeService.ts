/**
 * @module nomba/interfaces/charge
 * @description Charge service contract
 */

import type {
	CancelChargeTransactionParams,
	ChargeOrder,
	ChargeTransactionDetails,
	FlashAccount,
	SaveCardOtpRequest,
	SubmitCardDetailsParams,
	SubmitCardDetailsResult,
	SubmitCardOtpParams,
	SubmitCardOtpResult,
	SubmitSaveCardOtpParams,
} from "../../../types/v1/charge/charge.types.js";
import type {
	CheckoutResult,
	TokenizedCardData,
} from "../../../types/v1/checkout/checkout.types.js";

export interface IChargeService {
	/**
	 * `GET /v1/checkout/order/{orderReference}`.
	 * @param orderReference The order's reference, from `nomba.checkout.createOrder`.
	 * @returns The order's details.
	 * @throws {NombaError} The call failed, e.g. `orderReference` does not exist.
	 */
	getOrder(orderReference: string): Promise<ChargeOrder>;
	/**
	 * `POST /v1/checkout/checkout-card-detail`.
	 * @param params The order reference and card details to charge.
	 * @returns The result of submitting the card; an OTP is typically sent next.
	 * @throws {NombaError} The call failed, e.g. the card was declined.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	submitCardDetails(
		params: SubmitCardDetailsParams,
	): Promise<SubmitCardDetailsResult>;
	/**
	 * `POST /v1/checkout/checkout-card-otp`.
	 * @param params The order reference and OTP the customer received.
	 * @returns The result of submitting the OTP.
	 * @throws {NombaError} The call failed, e.g. the OTP was wrong or expired.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	submitCardOtp(params: SubmitCardOtpParams): Promise<SubmitCardOtpResult>;
	/**
	 * `POST /v1/checkout/resend-otp`. Resends the payment OTP to the customer's phone.
	 * @param orderReference The order's reference.
	 * @throws {NombaError} The call failed, e.g. `orderReference` does not exist.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	resendOtp(orderReference: string): Promise<CheckoutResult>;
	/**
	 * `POST /v1/checkout/confirm-transaction-receipt`. The status after the OTP is submitted or a transfer
	 * is made.
	 * @param orderReference The order's reference.
	 * @returns The transaction's current status.
	 * @throws {NombaError} The call failed, e.g. `orderReference` does not exist.
	 */
	fetchTransactionDetails(
		orderReference: string,
	): Promise<ChargeTransactionDetails>;
	/**
	 * `GET /v1/checkout/get-checkout-kta/{orderReference}`. A Flash account number the customer can pay by
	 * transfer.
	 * @param orderReference The order's reference.
	 * @returns The Flash account to transfer payment to.
	 * @throws {NombaError} The call failed, e.g. `orderReference` does not exist.
	 */
	fetchFlashAccount(orderReference: string): Promise<FlashAccount>;
	/**
	 * `POST /v1/checkout/transaction/cancel`. Cancels an incomplete checkout transaction.
	 * @param params The order reference to cancel.
	 * @throws {NombaError} The call failed, e.g. the transaction already completed.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	cancelTransaction(
		params: CancelChargeTransactionParams,
	): Promise<CheckoutResult>;
	/**
	 * `POST /v1/checkout/user-card/saved-card/auth`. Sends an OTP; use when `getOrder` says the user has
	 * saved cards.
	 * @param orderReference The order's reference.
	 * @throws {NombaError} The call failed, e.g. `orderReference` does not exist.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	requestSavedCardsOtp(orderReference: string): Promise<CheckoutResult>;
	/**
	 * `GET /v1/checkout/user-card/{orderReference}`. Needs the OTP from `requestSavedCardsOtp`.
	 * @param orderReference The order's reference.
	 * @param otp The OTP sent by `requestSavedCardsOtp`.
	 * @returns The customer's saved, tokenized cards.
	 * @throws {NombaError} The call failed, e.g. the OTP was wrong or expired.
	 */
	getSavedCards(
		orderReference: string,
		otp: string,
	): Promise<{
		tokenizedCardData?: TokenizedCardData[];
	}>;
	/**
	 * `POST /v1/checkout/user-card/auth`. Sends an OTP before saving a card; call after a successful
	 * payment.
	 * @param params The order reference and card to save.
	 * @throws {NombaError} The call failed, e.g. `orderReference` does not exist.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	requestSaveCardOtp(params: SaveCardOtpRequest): Promise<CheckoutResult>;
	/**
	 * `POST /v1/checkout/user-card`. Submits the OTP, which saves the card for later use.
	 * @param params The order reference and OTP from `requestSaveCardOtp`.
	 * @throws {NombaError} The call failed, e.g. the OTP was wrong or expired.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed.
	 */
	submitSaveCardOtp(params: SubmitSaveCardOtpParams): Promise<CheckoutResult>;
}
