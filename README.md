# aws-param-cache

Cache un/encrypted expiring values as AWS SSM parameters with a TTL

## Usage
```js
const SSMCache = require('@cribadvisor/aws-param-cache');

const cache = new SSMCache({
  secret: true,
  basePath: "/cache"
});

const getAccessToken = async () => {
  let accessToken = cache.get("my_token");
  if (!accessToken) {
    // obtain a new token
    // const { newToken, ttl } = getNewToken(...)
    accessToken = newToken;
    await cache.set("my_token", accessToken, ttl);
  }
  return accessToken;
};
```

## Options

### secret

> Sets the parameter type: `true` to use `SecureString` `false` to use `String`

Type: `bool`

Default: `true`

### basePath

> Where the parameters are stored within SSM *(excluding trailing slash)*

> Be sure to update the IAM policy (see below) if changed

Type: `string`

Default: `/cache`

## Required IAM permissions
**NOTE:**
1. Replace `Resource` with your AWS region and account ID
2. Replace `/cache` with the modified `basePath` if applicable
```
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Stmt1585412677747",
      "Action": [
        "ssm:DeleteParameter",
        "ssm:GetParameter",
        "ssm:PutParameter"
      ],
      "Effect": "Allow",
      "Resource": "arn:aws:ssm:<region>:<account_ID>:parameter/cache/*"
    }
  ]
}
```
