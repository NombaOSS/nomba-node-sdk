/** Named keys of T, dropping index signatures like `[key: string]: unknown`. */
type KnownKeys<T> = keyof {
	[K in keyof T as string extends K
		? never
		: number extends K
			? never
			: K]: T[K];
};

/** Keys of T that are not optional. Pins the required/optional flags documented by Nomba. */
export type RequiredKeys<T> = {
	[K in KnownKeys<T>]-?: Record<never, never> extends Pick<T, K> ? never : K;
}[KnownKeys<T>];
