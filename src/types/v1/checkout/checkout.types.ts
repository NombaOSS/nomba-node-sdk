/**
 * @module nomba/types/checkout
 * @description Checkout types
 */

/**
 * Checkout transaction status values returned in transactionDetails.status.
 * Use this field (not statusCode) to verify payment success.
 * @see https://developer.nomba.com/docs/products/accept-payment/verify-transactions
 */
export type CheckoutTransactionStatus =
	| "PAYMENT SUCCESSFUL" // Payment confirmed - safe to deliver goods/services
	| "PENDING" // Still processing
	| "FAILED PAYMENT"; // Payment did not complete

export type CheckoutOrder = {
	/** Your reference for the order. */
	orderReference?: string;
	customerId?: string;
	/** Where the customer is redirected after payment. */
	callbackUrl: string;
	customerEmail: string;
	amount: number;
	/** The API spec lists NGN, CDF and USD; the checkout guide also lists EUR and GBP (activated on request). DRC accounts cannot use NGN. */
	currency: "NGN" | "CDF" | "USD" | "EUR" | "GBP";
	/** Account to deposit the funds into. Must be one of your outlet accounts. */
	accountId?: string;
	/** Payment methods to show. Defaults to all supported for your account and region. */
	allowedPaymentMethods?: (
		| "Card"
		| "Transfer"
		| "Nomba QR"
		| "USSD"
		| "Buy Now Pay Later"
		| "MOMO"
		| "Intl Card"
		| "Apple Pay"
		| "Intl Transfer"
	)[];
	/** Splits the inflow across accounts. */
	splitRequest?: {
		splitType?: "PERCENTAGE" | "AMOUNT";
		splitList?: { accountId?: string; value?: number }[];
	};
	/** String keys and values, returned in webhook payloads. Set "region" to "CD" to route through DRC checkout. */
	orderMetaData?: Record<string, string>;
};

export type CreateCheckoutOrderParams = {
	order: CheckoutOrder;
	/** Tokenize the card used, only if you will charge it again later. */
	tokenizeCard?: boolean;
};

export type FetchCheckoutTransactionParams = {
	/** "ORDER_REFERENCE" is the reference you passed; "ORDER_ID" is the uuid Nomba returned. */
	idType?: "ORDER_ID" | "ORDER_REFERENCE";
	id?: string;
};

export type RefundCheckoutTransactionParams = {
	transactionId: string;
	/** For a partial refund. */
	amount?: number;
	/** Refund by bank transfer: 10 digit account number and bank code. */
	accountNumber?: string;
	bankCode?: string;
};

export type ChargeTokenizedCardParams = {
	/** The tokenKey returned in the webhook. */
	tokenKey: string;
	order?: CheckoutOrder;
};

export type ListTokenizedCardsParams = {
	customerEmail?: string;
	/** Based on when the token was created. */
	startDate?: string;
	endDate?: string;
	/** Page number to start from. Omit or 0 for the first page. */
	page?: number;
};

export type UpdateTokenizedCardParams = {
	tokenKey: string;
	currentEmailAddress: string;
	newEmailAddress: string;
};

export type CheckoutOrderCreated = {
	checkoutLink: string;
	/** The Nomba-generated order id, not the reference you passed. Use it as `id` with idType "ORDER_ID". */
	orderReference: string;
};

export type CheckoutTransaction = {
	success?: boolean;
	message?: string;
	order?: {
		orderId?: string;
		orderReference?: string;
		customerId?: string;
		accountId?: string;
		callbackUrl?: string;
		customerEmail?: string;
		amount?: number;
		currency?: string;
	};
	transactionDetails?: {
		transactionDate?: string;
		paymentReference?: string;
		paymentVendorReference?: string;
		tokenizedCardPayment?: boolean;
		/** Card processor response code. Use `status` field for payment verification. */
		statusCode?: string;
		/** Payment status. Use this field to verify payment success, not statusCode. */
		status?: CheckoutTransactionStatus;
	};
	transferDetails?: {
		sessionId?: string;
		beneficiaryAccountName?: string;
		beneficiaryAccountNumber?: string;
		originatorAccountName?: string;
		originatorAccountNumber?: string;
		narration?: string;
		destinationInstitutionCode?: string;
		paymentReference?: string;
	};
	cardDetails?: {
		cardPan?: string;
		cardType?: string;
		cardCurrency?: string;
		cardBank?: string;
	};
};

export type CheckoutResult = {
	success: boolean;
	message: string;
};

export type TokenizedCardResult = {
	status?: boolean;
	message?: string;
};

export type ChargeTokenizedCardResult = TokenizedCardResult & {
	orderId?: string;
	orderReference?: string;
	/** `true` if the bank requires an OTP; the charge is pending until `submitCardOtp` is called with `transactionId`. */
	otpRequired?: boolean;
	/** Only present when `otpRequired` is true. Pass to `ChargeService.submitCardOtp`. */
	transactionId?: string;
};

export type TokenizedCardData = {
	tokenKey?: string;
	customerEmail?: string;
	cardType?: string;
	cardPan?: string;
	tokenExpirationDate?: string;
};

export type TokenizedCardList = {
	/** The next page number, "0" when there are no more pages. */
	nextPage?: string;
	tokenizedCardDataList?: TokenizedCardData[];
};

export type UpdatedTokenizedCard = TokenizedCardResult & {
	tokenizedCardData?: TokenizedCardData[];
};
