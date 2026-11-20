/**
 * @module nomba
 * @description Composition root: builds the HTTP client and injects it into every service
 */

import type { IHttpClient } from "./interfaces/http/IHttpClient.js";
import type { IAccountsService } from "./interfaces/v1/accounts/index.js";
import type { IBettingService } from "./interfaces/v1/betting/index.js";
import type { ICableService } from "./interfaces/v1/cable/index.js";
import type { IChargeService } from "./interfaces/v1/charge/index.js";
import type { ICheckoutService } from "./interfaces/v1/checkout/index.js";
import type { IDataService } from "./interfaces/v1/data/index.js";
import type { IDirectDebitsService } from "./interfaces/v1/direct-debits/index.js";
import type { IElectricityService } from "./interfaces/v1/electricity/index.js";
import type { IGlobalCollectionsService } from "./interfaces/v1/globals/collections/index.js";
import type { IGlobalPayoutService } from "./interfaces/v1/globals/payouts/index.js";
import type { IRequeryService } from "./interfaces/v1/requery/index.js";
import type { ITerminalsService } from "./interfaces/v1/terminals/index.js";
import type { ITransactionsService } from "./interfaces/v1/transactions/index.js";
import type { IVirtualAccountsService } from "./interfaces/v1/virtual-accounts/index.js";
import type { IWebhooksService } from "./interfaces/v1/webhooks/index.js";
import type { IAirtimeV2Service } from "./interfaces/v2/airtime/index.js";
import type { IBettingV2Service } from "./interfaces/v2/betting/index.js";
import type { ICableV2Service } from "./interfaces/v2/cable/index.js";
import type { IDataV2Service } from "./interfaces/v2/data/index.js";
import type { IElectricityV2Service } from "./interfaces/v2/electricity/index.js";
import type { ITransfersService } from "./interfaces/v2/transfers/index.js";
import type { TokenData } from "./lib/token-store.js";
import { HttpClient } from "./services/http/http-client.service.js";
import { AccountsService } from "./services/v1/accounts/accounts.service.js";
import { BettingService } from "./services/v1/betting/betting.service.js";
import { CableService } from "./services/v1/cable/cable.service.js";
import { ChargeService } from "./services/v1/charge/charge.service.js";
import { CheckoutService } from "./services/v1/checkout/checkout.service.js";
import { DataService } from "./services/v1/data/data.service.js";
import { DirectDebitsService } from "./services/v1/direct-debits/direct-debits.service.js";
import { ElectricityService } from "./services/v1/electricity/electricity.service.js";
import { GlobalCollectionsService } from "./services/v1/globals/collections.service.js";
import { GlobalPayoutService } from "./services/v1/globals/payout.service.js";
import { RequeryService } from "./services/v1/requery/requery.service.js";
import { TerminalsService } from "./services/v1/terminals/terminals.service.js";
import { TransactionsService } from "./services/v1/transactions/transactions.service.js";
import { VirtualAccountsService } from "./services/v1/virtual-accounts/virtual-accounts.service.js";
import { WebhooksService } from "./services/v1/webhooks/webhooks.service.js";
import { AirtimeV2Service } from "./services/v2/airtime/airtime.service.js";
import { BettingV2Service } from "./services/v2/betting/betting.service.js";
import { CableV2Service } from "./services/v2/cable/cable.service.js";
import { DataV2Service } from "./services/v2/data/data.service.js";
import { ElectricityV2Service } from "./services/v2/electricity/electricity.service.js";
import { TransfersService } from "./services/v2/transfers/transfers.service.js";
import type {
	Environment,
	HttpMethod,
	HttpRequestOptions,
	NombaOptions,
} from "./types/common/common.types.js";

/**
 * The Nomba SDK client. Exposes one property per product (`accounts`, `transfers`, `electricity`, ...),
 * each backed by the shared, authenticated HTTP transport.
 */
export class Nomba {
	readonly accounts: IAccountsService;
	readonly virtualAccounts: IVirtualAccountsService;
	readonly checkout: ICheckoutService;
	readonly charge: IChargeService;
	readonly transfers: ITransfersService;
	readonly requery: IRequeryService;
	readonly directDebits: IDirectDebitsService;
	readonly transactions: ITransactionsService;
	readonly terminals: ITerminalsService;
	readonly electricity: IElectricityV2Service;
	readonly cable: ICableV2Service;
	readonly betting: IBettingV2Service;
	readonly airtime: IAirtimeV2Service;
	readonly data: IDataV2Service;
	// v1 bill validation services
	readonly billElectricity: IElectricityService;
	readonly billCable: ICableService;
	readonly billBetting: IBettingService;
	readonly billData: IDataService;
	readonly globalCollections: IGlobalCollectionsService;
	readonly globalPayout: IGlobalPayoutService;
	readonly webhooks: IWebhooksService;
	readonly #http: IHttpClient;

	/**
	 * @param options Client credentials and transport configuration.
	 * @param http Replace the transport, e.g. with a fake in tests. Defaults to the real `HttpClient`.
	 */
	constructor(
		options: NombaOptions,
		http: IHttpClient = new HttpClient(options),
	) {
		this.#http = http;
		this.accounts = new AccountsService(http);
		this.virtualAccounts = new VirtualAccountsService(http);
		this.checkout = new CheckoutService(http);
		this.charge = new ChargeService(http);
		this.transfers = new TransfersService(http);
		this.requery = new RequeryService(http);
		this.directDebits = new DirectDebitsService(http);
		this.transactions = new TransactionsService(http);
		this.terminals = new TerminalsService(http);
		// Electricity, cable, betting, airtime and data use v2 endpoints for payments
		this.electricity = new ElectricityV2Service(http);
		this.cable = new CableV2Service(http);
		this.betting = new BettingV2Service(http);
		this.airtime = new AirtimeV2Service(http);
		this.data = new DataV2Service(http);
		// v1 bill validation services (provider lists, lookups, plan fetching)
		this.billElectricity = new ElectricityService(http);
		this.billCable = new CableService(http);
		this.billBetting = new BettingService(http);
		this.billData = new DataService(http);
		this.globalCollections = new GlobalCollectionsService(http);
		this.globalPayout = new GlobalPayoutService(http);
		this.webhooks = new WebhooksService(http);
	}

	/** `"production"` or `"sandbox"`, as passed to the constructor (defaults to `"production"`). */
	get environment(): Environment {
		return this.#http.environment;
	}

	/**
	 * `POST /v1/auth/token/issue`. Gets a new access token. Called for you automatically on first use,
	 * so you normally never need this directly.
	 * @returns The issued token data.
	 * @throws {NombaError} The credentials were rejected.
	 */
	issueToken(): Promise<TokenData> {
		return this.#http.issueToken();
	}

	/**
	 * `POST /v1/auth/token/refresh`. Refreshes the stored token. Called for you automatically 5 minutes
	 * before expiry, so you normally never need this directly.
	 * @returns The refreshed token data.
	 * @throws {Error} No token has been issued yet.
	 * @throws {NombaError} The refresh token was rejected.
	 */
	refreshToken(): Promise<TokenData> {
		return this.#http.refreshToken();
	}

	/**
	 * `POST /v1/auth/token/revoke`. Ends the session, e.g. on shutdown. A no-op if no token is held.
	 * @throws {NombaError} Nomba rejected the revoke call.
	 */
	revokeToken(): Promise<void> {
		return this.#http.revokeToken();
	}

	/**
	 * Makes an authenticated call to any Nomba endpoint, including ones this SDK has no dedicated method
	 * for. Issues or refreshes the token as needed.
	 * @param method The HTTP method.
	 * @param path The endpoint path, starting with `/` (e.g. `/v1/accounts/parent`).
	 * @param options Query params, request body, idempotency key and related per-call overrides.
	 * @returns The response body's `data` field.
	 * @throws {TokenError} Getting or refreshing the access token failed; the request was never sent.
	 * @throws {NombaError} A non-2xx response, or a 2xx whose body `code` is not one of `options.okCodes`.
	 * @throws {OutcomeUnknownError} A mutating call failed in a way that does not say whether it was
	 * processed (timeout, network error, 5xx, or a 409); check its status before retrying.
	 */
	request<T>(
		method: HttpMethod,
		path: string,
		options?: HttpRequestOptions,
	): Promise<T> {
		return this.#http.request<T>(method, path, options);
	}
}
