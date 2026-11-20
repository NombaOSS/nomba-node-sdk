/**
 * @module nomba/types/virtual-accounts
 * @description VirtualAccounts types
 */

export type CreateVirtualAccountParams = {
	/** Your unique reference for the account. 16 to 64 characters. */
	accountRef: string;
	/** 8 to 64 characters. */
	accountName: string;
	/** The guide lists it as required; the API spec does not list it. */
	currency?: "NGN";
	/** Defaults to the parent account's BVN. */
	bvn?: string;
	/** Exactly 11 digits. Can be sent alone or with `bvn`. */
	nin?: string;
	/** e.g. "2026-01-30 12:15:00". Omit for a permanent (static) account. */
	expiryDate?: string;
	/** The account then accepts only this exact amount. */
	expectedAmount?: number;
	/** Receives `payment_success`/`payment_failed` webhook events for inflows into this account. */
	callbackUrl?: string;
	/** Reject inflows whose sender name doesn't match `accountName` (name order is ignored). Sends a `payment_failed` webhook and reverses the funds per the sending bank's policy. */
	restrictInflowToAccountName?: boolean;
};

export type UpdateVirtualAccountParams = {
	/** 8 to 64 characters. Advised in the webhook after the update. */
	newAccountRef?: string;
	accountName?: string;
	/** Decimal string, e.g. "100.0". The account then accepts only this exact amount. */
	expectedAmount?: string;
};

export type FilterVirtualAccountsParams = {
	accountName?: string;
	accountRef?: string;
	bvn?: string;
	bankAccountNumber?: string;
	/** ISO 8601, e.g. "2023-08-30T14:56:59.000Z" */
	dateCreatedFrom?: string;
	dateCreatedTo?: string;
	expired?: boolean;
	/** Whether the virtual account is in use. */
	resourceAcquired?: boolean;
};

export type VirtualAccount = {
	createdAt: string;
	accountHolderId: string;
	accountRef: string;
	bvn: string;
	accountName: string;
	bankName: string;
	bankAccountName: string;
	bankAccountNumber: string;
	currency: "NGN";
	/** The spec lists it as required, but the docs' own lookup example omits it. */
	callbackUrl?: string;
	expired: boolean;
	/** Whether name-based inflow restriction is active. */
	restrictInflowToAccountName?: boolean;
};

/** The create response. Its spec's `required` list names fields it does not define, so only what the docs' example shows is required. */
export type CreatedVirtualAccount = Omit<VirtualAccount, "expired"> & {
	identifierType?: "BVN" | "NIN" | "BVN_AND_NIN";
	expiryDate?: string;
	expired?: boolean;
};

export type VirtualAccountList = {
	results: VirtualAccount[];
	/** Pass as `cursor` to get the next page. Empty when there are no more pages. */
	cursor: string;
};
