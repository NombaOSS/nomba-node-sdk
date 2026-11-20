/**
 * @module nomba/types/global-payout
 * @description GlobalPayout types
 */

export type ExchangeRatesParams = {
	/** ISO 4217. */
	from: string;
	/** ISO 4217. */
	to: string;
	region?: string;
};

export type ConvertMoneyParams = {
	amount: number;
	/** ISO 4217 source currency. */
	currency: string;
	destinationCurrency: string;
	/** EXCHANGE for currency conversions. */
	transactionType: string;
};

/**
 * Sent in the body; the API dedupes on it (same key and body replays the original, with `idempotentReplay`).
 * Required to prevent double disbursement. After an OutcomeUnknownError, retry with the same key;
 * change anything about the payment and you must use a new key. At most 128 characters.
 */
export type BodyIdempotencyKey = { idempotencyKey: string };

export type AuthorizeExchangeParams = BodyIdempotencyKey & {
	amount: number;
	sourceCurrency: string;
	destinationCurrency: string;
	senderName: string;
	receiverName: string;
	/** ISO 3166-1 alpha-2. */
	sourceCountryIsoCode: string;
	destinationCountryIsoCode: string;
	narration?: string;
	/** An `exchangeRateId` from `exchangeRates`. */
	lockedExchangeRateId?: string;
};

export type PaymentMethod =
	| "BANK"
	| "MobileMoney"
	| "INTERAC"
	| "FASTER_PAYMENTS"
	| "SEPA"
	| "ACH"
	| "WIRE";

/** Which fields are required depends on the payment method and corridor; see `paymentMethods`. */
export type AuthorizeTransferParams = BodyIdempotencyKey & {
	amount: number;
	sourceCurrency: string;
	destinationCurrency: string;
	receiverName: string;
	/** ISO 3166-1 alpha-2. */
	sourceCountryIsoCode: string;
	destinationCountryIsoCode: string;
	paymentMethod: PaymentMethod;
	accountType: "INDIVIDUAL" | "CORPORATE";
	/** Account number, IBAN, or phone number for MobileMoney. */
	accountNumber?: string;
	/** Bank code, sort code, SWIFT/BIC or institution number, depending on the method. */
	institutionCode?: string;
	institutionName?: string;
	/** Required for ACH and WIRE. */
	bankAccountType?: "CHECKING" | "SAVINGS";
	/** Required for ACH, WIRE and SEPA: a code from `purposeOfPayments` in `paymentMethods`. */
	purposeOfPayment?: string;
	narration?: string;
	lockedExchangeRateId?: string;
	bankAddress?: string;
	bankCity?: string;
	bankState?: string;
	bankZipCode?: string;
	beneficiary?: {
		beneficiaryEmail?: string;
		securityQuestion?: string;
		securityQuestionAnswer?: string;
		/** Canada only. */
		transitNumber?: string;
		beneficiaryAddress?: string;
		beneficiaryCity?: string;
		beneficiaryState?: string;
		beneficiaryPostCode?: string;
	};
};

export type PayoutStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "PENDING";

export type InstitutionProvidersParams = {
	/** true for mobile money providers, false for banks and other institutions. */
	isMobileMoney?: boolean;
	/** ISO 3166-1 alpha-2 destination country. */
	countryIsoCode?: string;
};

export type PaymentMethodsParams = {
	/** Include it to get the corridor's exact requiredFields and optionalFields. */
	destinationCountryIsoCode?: string;
	destinationCurrency?: string;
	code?: string;
	name?: string;
};

export type PayoutAccount = {
	/** The wallet id; pass to `getAccount`. Not a currency code. */
	accountId: string;
	name: string;
	currency: string;
	/** Null when the balance could not be read (status UNAVAILABLE). */
	balance: number | null;
	/** The balance less liens. Null when the balance could not be read. */
	availableBalance: number | null;
	/** UNAVAILABLE: the account exists but its balance could not be read this time; retry. */
	status: "ACTIVE" | "UNAVAILABLE";
	operationRegion?: string;
};

export type ExchangeRate = {
	/** Pass as `lockedExchangeRateId` to use this rate. */
	exchangeRateId: string;
	currencyPairName: string;
	/** Formatted, e.g. "$1.13". */
	bidRate: string;
	askRate: string;
	midRate: string;
	createdAt: string;
	tradeRegion?: string;
	tradeContext?: string;
	updatedAt?: string;
};

export type Conversion = {
	fromAmount: number;
	fromCurrency: string;
	fromFormatted?: string;
	toAmount: number;
	toCurrency: string;
	toFormatted?: string;
	spreadAmount?: number;
	spreadCurrency?: string;
	exchangeRateId: string;
	currencyPairName?: string;
	feeAmount?: number;
	feeCurrency?: string;
	feeExpression?: string;
};

export type PayoutResult = {
	/** Pass to `getTransaction`. */
	wtTransactionId: string;
	coreTransactionId?: string;
	/** A replay returns the current status, which may still be PROCESSING; use the webhook for the outcome. */
	status: PayoutStatus;
	coreStatus?: string;
	/** TRANSFER or EXCHANGE. */
	type?: string;
	prettyStatus?: string;
	idempotencyKey?: string;
	/** True when nothing new was created because the key was already used. */
	idempotentReplay?: boolean;
	/** Amounts in here are strings, e.g. "250.0". */
	meta?: Record<string, string>;
};

export type PayoutTransaction = {
	transactionId: string;
	status: PayoutStatus;
	coreStatus?: string;
	type?: string;
	createdAt?: string;
	idempotencyKey?: string;
};

export type InstitutionProvider = {
	/** Pass as `institutionCode`. */
	code: string;
	/** Pass as `institutionName`. */
	displayName: string;
};

export type PaymentMethodInfo = {
	code: string;
	displayName: string;
	purposeOfPaymentRequired?: boolean;
	/** Empty on the catalogue response (no destinationCountryIsoCode). */
	purposeOfPayments?: { code: string; displayName: string }[];
	/** Dotted names are nested fields, e.g. beneficiary.transitNumber. */
	requiredFields?: string[];
	optionalFields?: string[];
	accountTypes?: string[];
	bankAccountTypes?: string[];
	supportedCorridors?: { countryIsoCode: string; currency: string }[];
};
