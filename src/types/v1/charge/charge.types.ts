/**
 * @module nomba/types/charge
 * @description Charge types
 */

/** The shape shown in the docs' example for the stringified `cardDetails`. Use strings for values with leading zeros, which numbers would lose. */
export type CardDetails = {
	cardCVV: number | string;
	cardExpiryMonth: number | string;
	cardExpiryYear: number | string;
	cardNumber: string;
	cardPin: number | string;
};

/** Browser information for the device making the calls, used for 3D Secure. */
export type DeviceInformation = {
	httpBrowserLanguage?: string;
	httpBrowserJavaEnabled?: boolean;
	httpBrowserJavaScriptEnabled?: boolean;
	httpBrowserColorDepth?: string;
	httpBrowserScreenHeight?: string;
	httpBrowserScreenWidth?: string;
	httpBrowserTimeDifference?: string;
	userAgentBrowserValue?: string;
	deviceChannel?: string;
};

export type SubmitCardDetailsParams = {
	/**
	 * The docs call this "Stringified card details". Pass a CardDetails object to have it
	 * JSON-stringified, or an already prepared string (e.g. when data encryption is in use).
	 * The docs do not describe the encryption scheme, so the SDK does not encrypt.
	 */
	cardDetails?: string | CardDetails;
	/** The encryption key if data encryption is in use, else an empty string. */
	key?: string;
	orderReference?: string;
	/** Save the card for later. Not complete until the user-card OTP endpoints are called. */
	saveCard?: boolean;
	deviceInformation?: DeviceInformation;
};

export type SubmitCardOtpParams = {
	otp: string;
	orderReference: string;
	/** The transactionId returned when the card details were submitted. */
	transactionId: string;
};

export type CancelChargeTransactionParams = {
	transactionId: string;
	forceCancel: boolean;
};

export type SaveCardOtpRequest = {
	orderReference: string;
	phoneNumber: string;
};

export type SubmitSaveCardOtpParams = SaveCardOtpRequest & {
	otp: string;
};

export type ChargeOrderDetails = {
	orderId?: string;
	orderReference?: string;
	customerId?: string;
	accountId?: string;
	callbackUrl?: string;
	customerEmail?: string;
	amount?: number;
	currency?: string;
	businessName?: string;
	businessEmail?: string;
	businessLogo?: string;
};

export type ChargeOrder = {
	order?: ChargeOrderDetails;
	hasSavedCards?: boolean;
	/** Returned when data encryption is enabled for submitting card details, else an empty string. */
	base64EncodedRsaPublicKey?: string;
};

export type SubmitCardDetailsResult = {
	status?: boolean;
	message?: string;
	/** "00" completed, "T0" an OTP was sent and must be submitted next, "SO" 3D Secure is required (see secureAuthenticationData). */
	responseCode?: string;
	/** Pass this to the calls that need a transactionId. */
	transactionId?: string;
	secureAuthenticationData?: {
		jwt?: string;
		md?: string;
		acsUrl?: string;
		termUrl?: string;
	};
};

export type SubmitCardOtpResult = {
	status: boolean;
	message: string;
};

export type ChargeTransactionDetails = {
	status: boolean;
	message: string;
	order?: ChargeOrderDetails;
};

export type FlashAccount = {
	accountNumber: string;
	accountName: string;
	bankName: string;
};
