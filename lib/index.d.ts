interface SSMCacheOptions {
    secret?: Boolean,
    basePath?: String
}

export = SSMCache;

declare class SSMCache {
    constructor(options: SSMCacheOptions);

    get(key: String): Promise<String> | null;

    set(key: String, value: String, ttl: Number): Promise<PromiseResult<AWS.SSM.PutParameterResult, AWS.AWSError>>;
}
