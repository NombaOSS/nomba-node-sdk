/**
 * @module nomba/terminals
 * @description Nomba SDK for Node.js
 * @description Terminals resource
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 * @see https://developer.nomba.com/docs/api-reference/terminals
 */

import type { IHttpClient } from "../../../interfaces/http/IHttpClient.js";
import type { ITerminalsService } from "../../../interfaces/v1/terminals/index.js";
import { REJECTED, settle } from "../../../lib/outcome.js";
import { pathId } from "../../../lib/util.js";
import type { CallOptions } from "../../../types/common/common.types.js";
import type { OutcomeTable } from "../../../types/common/outcome.types.js";
import type {
	AssignTerminalParams,
	PushPaymentRequestParams,
	Terminal,
	TerminalPayment,
} from "../../../types/v1/terminals/terminals.types.js";

// Documented: code "00"; data.status pending, completed or failed. As with Global Payout, the docs never say
// "failed" is final, so only "completed" is success.
const PAYMENT_REQUEST_OUTCOMES: OutcomeTable = {
	codes: { "00": "success", ...REJECTED },
	statuses: { completed: "success", pending: "pending", failed: "pending" },
};

/** Terminals (v1): assign, unassign, and push payment requests to physical POS terminals. */
export class TerminalsService implements ITerminalsService {
	constructor(private readonly http: IHttpClient) {}

	/**
	 * `POST /v1/terminals/assign`. Assigns a terminal to the parent account.
	 * @param params The terminal ID to assign.
	 * @returns The assigned terminal's details.
	 * @throws {NombaError} The call failed, e.g. the terminal does not exist or is already assigned.
	 */
	assignToParent(params: AssignTerminalParams): Promise<Terminal> {
		return this.http.request("POST", "/v1/terminals/assign", {
			body: params,
		});
	}

	/**
	 * `POST /v1/terminals/assign/{subAccountId}`. Assigns a terminal to a sub account.
	 * @param subAccountId The sub account to assign the terminal to.
	 * @param params The terminal ID to assign.
	 * @returns The assigned terminal's details.
	 * @throws {NombaError} The call failed, e.g. the terminal or sub account does not exist.
	 */
	async assignToSubAccount(
		subAccountId: string,
		params: AssignTerminalParams,
	): Promise<Terminal> {
		return this.http.request(
			"POST",
			`/v1/terminals/assign/${pathId(subAccountId)}`,
			{ body: params },
		);
	}

	/**
	 * `POST /v1/terminals/unassign`. Unassigns a terminal from the parent account.
	 * @param params The terminal ID to unassign.
	 * @returns The unassigned terminal's details.
	 * @throws {NombaError} The call failed, e.g. the terminal is not assigned to this account.
	 */
	unassignFromParent(params: AssignTerminalParams): Promise<Terminal> {
		return this.http.request("POST", "/v1/terminals/unassign", {
			body: params,
		});
	}

	/**
	 * `POST /v1/terminals/unassign/{subAccountId}`. Unassigns a terminal from a sub account.
	 * @param subAccountId The sub account to unassign the terminal from.
	 * @param params The terminal ID to unassign.
	 * @returns The unassigned terminal's details.
	 * @throws {NombaError} The call failed, e.g. the terminal is not assigned to this sub account.
	 */
	async unassignFromSubAccount(
		subAccountId: string,
		params: AssignTerminalParams,
	): Promise<Terminal> {
		return this.http.request(
			"POST",
			`/v1/terminals/unassign/${pathId(subAccountId)}`,
			{ body: params },
		);
	}

	/**
	 * `POST /v1/terminals/payment-request/{terminalId}`. Triggers a payment prompt on the physical terminal.
	 * The customer taps or swipes their card, and the outcome is reported via webhook or requery.
	 * @param terminalId The terminal's ID to prompt for payment.
	 * @param params The amount and `merchantTxRef` (used as idempotency key).
	 * @param options Outcome closures (`onSuccess`, `onPending`, `onFailed`); without them, success resolves
	 * the result and pending/failure throws.
	 * @returns The payment result, or whatever `options.onSuccess`/`onPending`/`onFailed` returns.
	 * @throws {NombaError} The request was rejected (4xx).
	 * @throws {OutcomeUnknownError} The outcome could not be confirmed as success or failure.
	 * @throws {UnconfirmedOutcomeError} The result is pending and no `onPending` handler was given.
	 */
	async pushPaymentRequest<R = TerminalPayment>(
		terminalId: string,
		params: PushPaymentRequestParams,
		options: CallOptions<TerminalPayment, R> = {},
	): Promise<TerminalPayment | R> {
		return settle(
			this.http,
			"POST",
			`/v1/terminals/payment-request/${pathId(terminalId)}`,
			{ body: params },
			PAYMENT_REQUEST_OUTCOMES,
			{ field: "merchantTxRef", value: params.merchantTxRef },
			options,
		);
	}
}
