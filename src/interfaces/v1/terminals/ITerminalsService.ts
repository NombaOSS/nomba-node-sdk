/**
 * @module nomba/interfaces/terminals
 * @description Terminals service contract
 */

import type { CallOptions } from "../../../types/common/common.types.js";
import type {
	AssignTerminalParams,
	PushPaymentRequestParams,
	Terminal,
	TerminalPayment,
} from "../../../types/v1/terminals/terminals.types.js";

export interface ITerminalsService {
	/**
	 * `POST /v1/terminals/assign`. Assigns a terminal to the parent account.
	 * @param params The terminal to assign.
	 * @returns The assigned terminal.
	 * @throws {NombaError} The assignment was rejected.
	 */
	assignToParent(params: AssignTerminalParams): Promise<Terminal>;
	/**
	 * `POST /v1/terminals/assign/{subAccountId}`. Assigns a terminal to a sub account.
	 * @param subAccountId The sub account's ID.
	 * @param params The terminal to assign.
	 * @returns The assigned terminal.
	 * @throws {NombaError} The assignment was rejected.
	 */
	assignToSubAccount(
		subAccountId: string,
		params: AssignTerminalParams,
	): Promise<Terminal>;
	/**
	 * `POST /v1/terminals/unassign`. Unassigns a terminal from the parent account.
	 * @param params The terminal to unassign.
	 * @returns The unassigned terminal.
	 * @throws {NombaError} The unassignment was rejected.
	 */
	unassignFromParent(params: AssignTerminalParams): Promise<Terminal>;
	/**
	 * `POST /v1/terminals/unassign/{subAccountId}`. Unassigns a terminal from a sub account.
	 * @param subAccountId The sub account's ID.
	 * @param params The terminal to unassign.
	 * @returns The unassigned terminal.
	 * @throws {NombaError} The unassignment was rejected.
	 */
	unassignFromSubAccount(
		subAccountId: string,
		params: AssignTerminalParams,
	): Promise<Terminal>;
	/**
	 * `POST /v1/terminals/payment-request/{terminalId}`. Pushes a payment request to a terminal for the
	 * cardholder to complete.
	 * @param terminalId The terminal's ID.
	 * @param params The payment request details.
	 * @param options Idempotency key, outcome closures (`onSuccess`/`onPending`/`onFailed`), and related
	 * per-call overrides.
	 * @returns The created payment request, or the matching outcome closure's result.
	 * @throws {NombaError} The request was rejected and no `onFailed` closure was given.
	 * @throws {OutcomeUnknownError} The request outcome could not be determined and no `onPending` was supplied.
	 * @throws {UnconfirmedOutcomeError} The response status is pending or undocumented and no `onPending` was supplied.
	 */
	pushPaymentRequest<R = TerminalPayment>(
		terminalId: string,
		params: PushPaymentRequestParams,
		options?: CallOptions<TerminalPayment, R>,
	): Promise<TerminalPayment | R>;
}
