type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export class AuthTokenPayloadDTO {
	/**
	 * The unique ID of the user provided by this application
	 */
	sub: string;
	/**
	 * The role of the user
	 */
	rol: string; //TODO: Fix this typing with generator
	/**
	 * The epoch time of when our JWT was issued by our back-end
	 */
	iat?: number;
	/**
	 * The epoch time of when our JWT expires
	 */
	exp?: number;
}
