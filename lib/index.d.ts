interface SSMCacheOptions {
    /**
     * Sets the parameter type: `true` to use `SecureString` `false` to use `String`
     */
    secret?: Boolean,
    /**
     * Where the parameters are stored within SSM *(excluding trailing slash)*
     * Be sure to update the IAM policy (see `README.md`) if changed
     */
    basePath?: String,
    /**
     * ARN of KMS key ID to use to encrypt parameter value
     */
    keyId?: String
}

export = SSMCache;

declare class SSMCache {
    constructor(options: SSMCacheOptions);

    /**
     * Get a parameter from SSM with the given key (excluding `basePath`)
     * @param key Name of the SSM parameter (within `basePath`)
     */
    get(key: String): Promise<String> | null;

    /**
     * `PUT` a parameter to SSM for the given key (excluding `basePath`)
     * @param key Name of the SSM parameter to store (within `basePath`)
     * @param value Value to store in SSM for the key
     * @param ttl How long in seconds after setting the parameter it should expire
     */
    set(key: String, value: String, ttl: Number): Promise<PromiseResult<AWS.SSM.PutParameterResult, AWS.AWSError>>;
}
