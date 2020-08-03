const { SSM } = require('aws-sdk');
const ow = require('ow');

class SSMCache {
    constructor(options = {}) {
        const defaults = {
            secret: true,
            basePath: "/cache",
            keyId: undefined
        };
        this.options = Object.assign({}, defaults, options);
        this._ssm = new SSM();
    }

    _escapeName(name) {
        return name.replace(/[^a-zA-Z0-9_.-\/]/g, "_");
    }

    async get(key) {
        ow(key, ow.string.not.empty);
        try {
            const name = this._escapeName(`${this.options.basePath}/${key}`);
            const result = await this._ssm.getParameter({
                Name: name,
                WithDecryption: this.options.secret
            }).promise();
            const param = result.Parameter;
            const now = new Date().getTime() / 1000;
            const timestamp = new Date(param.LastModifiedDate).getTime() / 1000;
            const { TTL: ttl, Value: value } = JSON.parse(param.Value);
            if (now > timestamp + ttl) {
                await this._ssm.deleteParameter({
                    Name: name
                }).promise();
                return null;
            }
            return value;
        } catch {
            return null;
        }
    }

    async set(key, value, ttl) {
        ow(key, ow.string.not.empty);
        ow(value, ow.string);
        ow(ttl, ow.number.is(x => x > 0 || `Expected \`${x}\` to be greater than 0`));
        const param = JSON.stringify({
            TTL: ttl,
            Value: value
        });
        return await this._ssm.putParameter({
            Name: this._escapeName(`${this.options.basePath}/${key}`),
            Value: param,
            Type: this.options.secret ? "SecureString" : "String",
            Overwrite: true,
            KeyId: this.options.keyId
        }).promise();
    }
};

module.exports = SSMCache;
