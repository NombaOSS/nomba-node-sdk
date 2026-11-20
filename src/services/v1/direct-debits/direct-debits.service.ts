/**
 * @module nomba/direct-debits
 * @description Nomba SDK for Node.js
 * @description Direct Debits resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/direct-debits
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { IDirectDebitsService } from "../../../interfaces/v1/direct-debits/IDirectDebitsService.js";
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

/** Direct debit mandates (v1): create, inspect, debit, and update recurring mandates. */
export class DirectDebitsService implements IDirectDebitsService {
	constructor(private readonly http: IHttpClient) {}

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
	createMandate(params: CreateMandateParams): Promise<CreatedMandate> {
		return this.http.request("POST", "/v1/direct-debits", {
			body: params,
			codeField: "responseCode",
			descriptionField: "responseMessage",
			idempotencyKey: params.merchantReference,
		});
	}

	/**
	 * `GET /v1/direct-debits/status?mandateId={mandateId}`.
	 * @param mandateId The mandate to look up.
	 * @returns The mandate's current status.
	 * @throws {NombaError} `mandateId` is not found, or the request failed.
	 */
	getMandateStatus(mandateId: string): Promise<MandateStatus> {
		return this.http.request("GET", "/v1/direct-debits/status", {
			query: { mandateId },
		});
	}

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
	debitMandate(params: DebitMandateParams): Promise<MandateDebitResult> {
		return this.http.request("POST", "/v1/direct-debits/debit-mandate", {
			body: params,
		});
	}

	/**
	 * `GET /v1/direct-debits/mandates`.
	 * @param params Pagination and filter params.
	 * @returns A page of mandates.
	 * @throws {NombaError} The request failed.
	 */
	listMandates(params: ListMandatesParams): Promise<MandatePage> {
		return this.http.request("GET", "/v1/direct-debits/mandates", {
			query: params,
		});
	}

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
	): Promise<UpdatedMandateStatus> {
		return this.http.request("PUT", "/v1/direct-debits/update-status", {
			body: params,
		});
	}
}
