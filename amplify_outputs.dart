const amplifyConfig = r'''{
  "version": "1",
  "data": {
    "aws_region": "us-west-2",
    "url": "https://wxc4v4f7ovcahml6nnsgvdbfea.appsync-api.us-west-2.amazonaws.com/graphql",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS",
    "authorization_types": ["AMAZON_COGNITO_USER_POOLS"]
  },
  "auth": {
    "aws_region": "us-west-2",
    "user_pool_id": "us-west-2_TPSoPWePu",
    "user_pool_client_id": "307c3rp36nkmaqel5l71sgdbdv",
    "identity_pool_id": "us-west-2:74cd2c51-8c53-4908-93e6-15bd2daabe7b",
    "username_attributes": ["email"],
    "standard_required_attributes": [
      "email",
      "given_name",
      "family_name"
    ],
    "mfa_configuration": "OPTIONAL",
    "mfa_methods": [
      "TOTP"
    ],
    "user_verification_types": ["email"],
    "unauthenticated_identities_enabled": false,
    "password_policy": {
      "min_length": 8,
      "require_lowercase": true,
      "require_uppercase": true,
      "require_numbers": true,
      "require_symbols": true
    },
    "groups": [
      {
        "USERS": {
          "precedence": 0
        }
      },
      {
        "NUTRITIONISTS": {
          "precedence": 1
        }
      },
      {
        "ADMIN": {
          "precedence": 2
        }
      }
    ],
    "oauth": {
      "identity_providers": [
        "GOOGLE"
      ],
      "redirect_sign_in_uri": [
        "http://localhost:3000/profile"
      ],
      "redirect_sign_out_uri": [
        "http://localhost:3000/"
      ],
      "response_type": "code",
      "scopes": [
        "phone",
        "email",
        "openid",
        "profile",
        "aws.cognito.signin.user.admin"
      ],
      "domain": "e2c748be1d135a2c6733.auth.us-west-2.amazoncognito.com"
    }
  }
}''';
