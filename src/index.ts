/**
 * @module nomba
 * @description Nomba SDK for Node.js
 * @author Nomba Financial Services
 * @version 1.0.0
 * @license MIT
 * @copyright 2026 Nomba
 * @homepage https://nomba.com
 * @support https://nomba.com/support
 * @repository https://github.com/NombaOSS/nomba-node-sdk
 * @docs https://developer.nomba.com
 */

export type { IHttpClient } from "./interfaces/http/IHttpClient.js";
export type * from "./interfaces/v1/accounts/IAccountsService.js";
export type * from "./interfaces/v1/betting/index.js";
export type * from "./interfaces/v1/cable/index.js";
export type * from "./interfaces/v1/charge/IChargeService.js";
export type * from "./interfaces/v1/checkout/ICheckoutService.js";
export type * from "./interfaces/v1/data/index.js";
export type * from "./interfaces/v1/direct-debits/IDirectDebitsService.js";
export type * from "./interfaces/v1/electricity/index.js";
export type * from "./interfaces/v1/globals/collections/IGlobalCollectionsService.js";
export type * from "./interfaces/v1/globals/payouts/IGlobalPayoutService.js";
export type * from "./interfaces/v1/requery/IRequeryService.js";
export type * from "./interfaces/v1/terminals/ITerminalsService.js";
export type * from "./interfaces/v1/transactions/ITransactionsService.js";
export type * from "./interfaces/v1/virtual-accounts/IVirtualAccountsService.js";
export type * from "./interfaces/v1/webhooks/IWebhooksService.js";
// Version 2 (Airtime, Data, Electricity, Cable, Betting)
export type * from "./interfaces/v2/airtime/index.js";
export type * from "./interfaces/v2/betting/index.js";
export type * from "./interfaces/v2/cable/index.js";
export type * from "./interfaces/v2/data/index.js";
export type * from "./interfaces/v2/electricity/index.js";
export type * from "./interfaces/v2/transfers/ITransfersService.js";
export {
	IdempotencyKeyAbsentError,
	isPending,
	NombaError,
	OutcomeUnknownError,
	TokenError,
	UnconfirmedOutcomeError,
} from "./lib/errors.js";
export type { TokenData, TokenStore } from "./lib/token-store.js";
export { MemoryTokenStore } from "./lib/token-store.js";
export type { PageParams } from "./lib/util.js";
export type { WebhookEvent } from "./lib/webhooks.js";
export { verifyWebhook } from "./lib/webhooks.js";
export { Nomba } from "./nomba.js";
// HttpClient
export { HttpClient } from "./services/http/http-client.service.js";
// Accounts
// Deprecated pre-refactor names, kept so upgrading is not a breaking change.
export {
	AccountsService,
	AccountsService as Accounts,
} from "./services/v1/accounts/accounts.service.js";
// v1 Validation Services (for v2 bill payments)
export { BettingService } from "./services/v1/betting/betting.service.js";
export { CableService } from "./services/v1/cable/cable.service.js";
// Charge
export {
	ChargeService,
	ChargeService as Charge,
} from "./services/v1/charge/charge.service.js";
// Checkout
export {
	CheckoutService,
	CheckoutService as Checkout,
} from "./services/v1/checkout/checkout.service.js";
export { DataService } from "./services/v1/data/data.service.js";
// DirectDebits
export {
	DirectDebitsService,
	DirectDebitsService as DirectDebits,
} from "./services/v1/direct-debits/direct-debits.service.js";
export { ElectricityService } from "./services/v1/electricity/electricity.service.js";
// GlobalCollections
export {
	GlobalCollectionsService,
	GlobalCollectionsService as GlobalCollections,
} from "./services/v1/globals/collections.service.js";
// GlobalPayout
export {
	GlobalPayoutService,
	GlobalPayoutService as GlobalPayout,
} from "./services/v1/globals/payout.service.js";
// Requery
export {
	RequeryService,
	RequeryService as Requery,
} from "./services/v1/requery/requery.service.js";
// Terminals
export {
	TerminalsService,
	TerminalsService as Terminals,
} from "./services/v1/terminals/terminals.service.js";
// Transactions
export {
	TransactionsService,
	TransactionsService as Transactions,
} from "./services/v1/transactions/transactions.service.js";
// VirtualAccounts
export {
	VirtualAccountsService,
	VirtualAccountsService as VirtualAccounts,
} from "./services/v1/virtual-accounts/virtual-accounts.service.js";
// Webhooks
export {
	WebhooksService,
	WebhooksService as Webhooks,
} from "./services/v1/webhooks/webhooks.service.js";
export { AirtimeV2Service } from "./services/v2/airtime/airtime.service.js";
export { BettingV2Service } from "./services/v2/betting/betting.service.js";
export { CableV2Service } from "./services/v2/cable/cable.service.js";
export { DataV2Service } from "./services/v2/data/data.service.js";
export { ElectricityV2Service } from "./services/v2/electricity/electricity.service.js";
// Transfers
export {
	TransfersService,
	TransfersService as Transfers,
} from "./services/v2/transfers/transfers.service.js";
export type * from "./types/common/common.types.js";
export type * from "./types/common/outcome.types.js";
export type * from "./types/v1/accounts/accounts.types.js";
export type * from "./types/v1/betting/betting.types.js";
export type * from "./types/v1/cable/cable.types.js";
export type * from "./types/v1/charge/charge.types.js";
export type * from "./types/v1/checkout/checkout.types.js";
export type * from "./types/v1/data/data.types.js";
export type * from "./types/v1/direct-debits/direct-debits.types.js";
export type * from "./types/v1/electricity/electricity.types.js";
export type * from "./types/v1/globals/collections.types.js";
export type * from "./types/v1/globals/payout.types.js";
export type * from "./types/v1/requery/requery.types.js";
export type * from "./types/v1/terminals/terminals.types.js";
export type * from "./types/v1/transactions/transactions.types.js";
export type * from "./types/v1/virtual-accounts/virtual-accounts.types.js";
export type * from "./types/v1/webhooks/webhooks.types.js";
export type * from "./types/v2/airtime/airtime.types.js";
export type * from "./types/v2/betting/betting.types.js";
export type * from "./types/v2/cable/cable.types.js";
export type * from "./types/v2/data/data.types.js";
export type * from "./types/v2/electricity/electricity.types.js";
export type * from "./types/v2/transfers/transfers.types.js";
