/**
 * @module nomba/interfaces/direct-debits
 * @description DirectDebits service contract
 */

import type {
	CreatedMandate,
	CreateMandateParams,
	DebitMandateParams,
	ListMandatesParams,
	MandateDebitResult,
	MandatePage,
	MandateStatus,
	UpdatedMandateStatus,
	UpdateMandateStatusParams,
} from "../../../types/v1/direct-debits/direct-debits.types.js";

export interface IDirectDebitsService {
	/**
	 * `POST /v1/direct-debits`.
	 * limit: this endpoint's response envelope is `{ responseCode, responseMessage, data }`, unlike every
	 * other endpoint's `{ code, description, data }` — confirmed from the spec's own example, not guessed.
	 * @param params The mandate to create; `merchantReference` is the idempotency key.
	 * @returns The created mandate.
	 * @throws {NombaError} The mandate params were rejected.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed;
	 * check the mandate status before retrying.
	 */
	createMandate(params: CreateMandateParams): Promise<CreatedMandate>;
	/**
	 * `GET /v1/direct-debits/status?mandateId={mandateId}`.
	 * @param mandateId The mandate to look up.
	 * @returns The mandate's current status.
	 * @throws {NombaError} `mandateId` is not found, or the request failed.
	 */
	getMandateStatus(mandateId: string): Promise<MandateStatus>;
	/**
	 * `POST /v1/direct-debits/debit-mandate`. No per-transaction reference field exists in params, so a
	 * random idempotency key is generated for error tracking. If the outcome is unknown, requery the mandate
	 * before retrying.
	 * @param params The mandate to debit and the amount.
	 * @returns The debit result.
	 * @throws {NombaError} The mandate is not active, or the debit was rejected.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed;
	 * check the mandate status before retrying.
	 */
	debitMandate(params: DebitMandateParams): Promise<MandateDebitResult>;
	/**
	 * `GET /v1/direct-debits/mandates`.
	 * @param params Pagination and filter params.
	 * @returns A page of mandates.
	 * @throws {NombaError} The request failed.
	 */
	listMandates(params: ListMandatesParams): Promise<MandatePage>;
	/**
	 * `PUT /v1/direct-debits/update-status`. No per-change reference field exists in params, so a random
	 * idempotency key is generated for error tracking. If the outcome is unknown, check the mandate status
	 * before retrying.
	 * @param params The mandate and the new status.
	 * @returns The mandate's updated status.
	 * @throws {NombaError} The status transition is invalid, or the request failed.
	 * @throws {OutcomeUnknownError} The call failed in a way that does not say whether it was processed;
	 * check the mandate status before retrying.
	 */
	updateMandateStatus(
		params: UpdateMandateStatusParams,
	): Promise<UpdatedMandateStatus>;
}
