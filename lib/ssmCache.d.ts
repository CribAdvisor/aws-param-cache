interface SSMCacheOptions {
    secret: Boolean,
    basePath: String
}

declare class SSMCache {
    constructor(options: SSMCacheOptions);

    get(key: String): Promise<String>

    set(key: String, value: String, ttl: Number): Promise<any>
}
