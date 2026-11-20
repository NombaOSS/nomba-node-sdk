/**
 * @module nomba/types/direct-debits
 * @description DirectDebits types
 */

export type CreateMandateParams = {
	customerAccountNumber: string;
	bankCode: string;
	customerName: string;
	customerAddress?: string;
	customerAccountName: string;
	amount: number;
	frequency:
		| "VARIABLE"
		| "WEEKLY"
		| "EVERY_TWO_WEEKS"
		| "MONTHLY"
		| "EVERY_TWO_MONTHS"
		| "EVERY_THREE_MONTHS"
		| "EVERY_FOUR_MONTHS"
		| "EVERY_FIVE_MONTHS"
		| "EVERY_SIX_MONTHS"
		| "EVERY_SEVEN_MONTHS"
		| "EVERY_EIGHT_MONTHS"
		| "EVERY_NINE_MONTHS"
		| "EVERY_TEN_MONTHS"
		| "EVERY_ELEVEN_MONTHS"
		| "EVERY_TWELVE_MONTHS";
	/**
	 * The spec's enum has no QUARTERLY but includes EVERY_TWO_WEEKS; the prose guide's table has QUARTERLY
	 * but no EVERY_TWO_WEEKS. Typed to the spec (the actual request schema); the two disagree and haven't
	 * been checked against a real call.
	 */
	narration?: string;
	customerPhoneNumber?: string;
	/** Numeric string (0-9). An idempotency-style tracking id; must be unique per transaction. */
	merchantReference: string;
	startDate: string;
	endDate: string;
	customerEmail: string;
	startImmediately?: boolean;
};

export type DebitMandateParams = {
	mandateId: string;
	/** Decimal string, e.g. "110.00" */
	amount: string;
};

export type ListMandatesParams = {
	page: number;
	pageSize: number;
	/** date, e.g. "2025-08-01" */
	from?: string;
	to?: string;
	status?: string;
};

export type UpdateMandateStatusParams = {
	mandateId: string;
	status: "SUSPEND" | "ACTIVE" | "DELETE";
};

export type CreatedMandate = {
	mandateId: string;
	merchantReference: string;
	/** The account to send the token authentication payment to. */
	phoneNumber: string;
	/** Human-readable instructions for completing mandate authentication. */
	description: string;
};

export type MandateStatus = {
	customerAccountName: string;
	mandateId: string;
	customerAccountNumber: string;
	mandateStatus: string;
	rejectionComment?: string;
	mandateAdviceStatus?: string;
};

export type MandateDebitResult = {
	mandateId?: string;
	status?: string;
	amount?: string;
	message?: string;
};

export type DirectDebitMandate = {
	status?: string;
	customerAccountNumber?: string;
	customerAccountName?: string;
	bankCode?: string;
	amount?: number;
	customerName?: string;
	customerAddress?: string;
	customerEmail?: string;
	customerPhoneNumber?: string;
	merchantReference?: string;
	frequency?: string;
	/**
	 * The spec types these as ISO date-time strings, but the guide's own example responses (GET single
	 * mandate, list mandates) show them as `[year, month, day, hour, minute]` arrays instead — likely a
	 * raw serialization of the backend's date type. Typed to allow either; confirm against a live call.
	 */
	startDate?: string | number[];
	endDate?: string | number[];
	mandateAdviceStatus?: string;
	mandateId?: string;
};

export type MandatePage = {
	/**
	 * The OpenAPI spec types this as a single object, not an array. The prose guide's own example response
	 * shows it as an array of mandates, which also matches the surrounding pagination fields. Typed as an
	 * array, trusting the guide's real example over the spec here; confirm against a live call.
	 */
	items?: DirectDebitMandate[];
	page?: number;
	pageSize?: number;
	totalItems?: number;
	totalPages?: number;
	hasMore?: boolean;
};

export type UpdatedMandateStatus = {
	mandateId?: string;
	mandateStatus?: string;
};
