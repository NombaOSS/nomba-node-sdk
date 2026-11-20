/**
 * @module nomba/types/accounts
 * @description Nomba SDK for Node.js
 * @description Accounts types
 * @author Nomba Financial Services
 * @version 1.0.0
 */

export type AccountStatus =
	| "ACTIVE"
	| "INACTIVE"
	| "SUSPENDED"
	| "PND"
	| "BLACKLISTED";

export type AccountType = "virtual" | "outlet";

export type SubAccountLookup = {
	/** The id of the sub account. */
	accountId?: string;
	/** The unique reference you passed when creating the sub account. */
	accountRef?: string;
};

export type AccountBalance = {
	/** Decimal string, e.g. "281946.0" */
	amount: string;
	currency: "NGN";
	timeCreated: string;
};

export type AccountDetails = {
	createdAt: string;
	accountId: string;
	accountHolderId: string;
	accountRef: string;
	bvn: string;
	status: AccountStatus;
	type: AccountType;
	accountName: string;
	currency: "NGN";
	banks: {
		bankAccountNumber: string;
		bankName: string;
		bankAccountName: string;
	}[];
};
