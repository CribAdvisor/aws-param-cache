import { SSM } from "aws-sdk";
import ow from "ow";

import type { PromiseResult } from "aws-sdk/lib/request";
import type { AWSError } from "aws-sdk/lib/error";

interface SSMCacheOptions {
  /**
   * Sets the parameter type: `true` to use `SecureString` `false` to use `String`
   */
  secret?: boolean;
  /**
   * Where the parameters are stored within SSM *(excluding trailing slash)*
   * Be sure to update the IAM policy (see `README.md`) if changed
   */
  basePath?: string;
  /**
   * ARN of KMS key ID to use to encrypt parameter value
   */
  keyId?: string;
}

class SSMCache {
  options: SSMCacheOptions;
  _ssm: SSM;

  constructor(options: SSMCacheOptions = {}) {
    const defaults: SSMCacheOptions = {
      secret: true,
      basePath: "/cache",
      keyId: undefined,
    };
    this.options = Object.assign({}, defaults, options);
    this._ssm = new SSM();
  }

  _escapeName(name: string) {
    return name.replace(/[^a-zA-Z0-9_.-\/]/g, "_");
  }

  /**
   * Get a parameter from SSM with the given key (excluding `basePath`)
   * @param key Name of the SSM parameter (within `basePath`)
   */
  async get(key: string): Promise<string | null> {
    ow(key, ow.string.not.empty);
    try {
      const name = this._escapeName(`${this.options.basePath}/${key}`);
      const result = await this._ssm
        .getParameter({
          Name: name,
          WithDecryption: this.options.secret,
        })
        .promise();
      const param = result.Parameter;
      if (!param?.LastModifiedDate || !param?.Value) {
        return null;
      }
      const now = new Date().getTime() / 1000;
      const timestamp = new Date(param.LastModifiedDate).getTime() / 1000;
      const { TTL: ttl, Value: value } = JSON.parse(param.Value);
      if (now > timestamp + ttl) {
        await this._ssm
          .deleteParameter({
            Name: name,
          })
          .promise();
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  /**
   * `PUT` a parameter to SSM for the given key (excluding `basePath`)
   * @param key Name of the SSM parameter to store (within `basePath`)
   * @param value Value to store in SSM for the key
   * @param ttl How long in seconds after setting the parameter it should expire
   */
  async set(
    key: string,
    value: string,
    ttl: number
  ): Promise<PromiseResult<SSM.PutParameterResult, AWSError>> {
    ow(key, ow.string.not.empty);
    ow(value, ow.string);
    ow(
      ttl,
      ow.number.is((x) => x > 0 || `Expected \`${x}\` to be greater than 0`)
    );
    const param = JSON.stringify({
      TTL: ttl,
      Value: value,
    });
    return await this._ssm
      .putParameter({
        Name: this._escapeName(`${this.options.basePath}/${key}`),
        Value: param,
        Type: this.options.secret ? "SecureString" : "String",
        Overwrite: true,
        KeyId: this.options.keyId,
      })
      .promise();
  }
}

export = SSMCache;
