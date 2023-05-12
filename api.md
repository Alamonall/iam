---
title: IAM v1.0
language_tabs:
  - "false": "false"
language_clients:
  - "false": ""
toc_footers: []
includes: []
search: false
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="iam">IAM v1.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

The IAM Service description

Base URLs:

<h1 id="iam-main">Main</h1>

## AppController_ping

<a id="opIdAppController_ping"></a>

> Code samples

`GET /`

<h3 id="appcontroller_ping-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Ping-pong!|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="iam-registration">Registration</h1>

## RegistrationController_init

<a id="opIdRegistrationController_init"></a>

> Code samples

`POST /registration/init`

> Example responses

> 200 Response

```json
{
  "registration_token": "string",
  "required_actions": [
    "email"
  ]
}
```

<h3 id="registrationcontroller_init-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[InitRegistrationResponse](#schemainitregistrationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RegistrationController_initAffirmation

<a id="opIdRegistrationController_initAffirmation"></a>

> Code samples

`POST /registration/affirmation/init`

> Body parameter

```json
{
  "registration_token": "string",
  "action": "email",
  "value": "string",
  "captcha": "string"
}
```

<h3 id="registrationcontroller_initaffirmation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RegistrationInitAffirmationRequest](#schemaregistrationinitaffirmationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "registration_token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}
```

<h3 id="registrationcontroller_initaffirmation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RegistrationInitAffirmationResponse](#schemaregistrationinitaffirmationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RegistrationController_completeAffirmation

<a id="opIdRegistrationController_completeAffirmation"></a>

> Code samples

`POST /registration/affirmation/complete`

> Body parameter

```json
{
  "registration_token": "string",
  "action": "email_code",
  "value": "string"
}
```

<h3 id="registrationcontroller_completeaffirmation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RegistrationCompleteAffirmationRequest](#schemaregistrationcompleteaffirmationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "registration_token": "string",
  "required_actions": [
    "email"
  ]
}
```

<h3 id="registrationcontroller_completeaffirmation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RegistrationCompleteAffirmationResponse](#schemaregistrationcompleteaffirmationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RegistrationController_complete

<a id="opIdRegistrationController_complete"></a>

> Code samples

`POST /registration/complete`

> Body parameter

```json
{
  "registration_token": "string",
  "secret": "string"
}
```

<h3 id="registrationcontroller_complete-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CompleteRegistrationRequest](#schemacompleteregistrationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "string"
}
```

<h3 id="registrationcontroller_complete-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CompleteRegistrationResponse](#schemacompleteregistrationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RegistrationController_resend

<a id="opIdRegistrationController_resend"></a>

> Code samples

`POST /registration/affirmation/resend`

> Body parameter

```json
{
  "token": "string"
}
```

<h3 id="registrationcontroller_resend-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RegistrationResendRequest](#schemaregistrationresendrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string"
}
```

<h3 id="registrationcontroller_resend-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RegistrationResendResponse](#schemaregistrationresendresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="iam-recovery">Recovery</h1>

## RecoveryController_init

<a id="opIdRecoveryController_init"></a>

> Code samples

`POST /recovery/password/reset/init`

> Example responses

> 200 Response

```json
{
  "reset_password_token": "string",
  "required_actions": [
    "email"
  ]
}
```

<h3 id="recoverycontroller_init-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[InitResetPasswordResponse](#schemainitresetpasswordresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RecoveryController_initAffirmation

<a id="opIdRecoveryController_initAffirmation"></a>

> Code samples

`POST /recovery/password/reset/affirmation/init`

> Body parameter

```json
{
  "reset_password_token": "string",
  "action": "email",
  "value": "string"
}
```

<h3 id="recoverycontroller_initaffirmation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RecoveryInitAffirmationRequest](#schemarecoveryinitaffirmationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "reset_password_token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}
```

<h3 id="recoverycontroller_initaffirmation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RecoveryInitAffirmationResponse](#schemarecoveryinitaffirmationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RecoveryController_completeAffirmation

<a id="opIdRecoveryController_completeAffirmation"></a>

> Code samples

`POST /recovery/password/reset/affirmation/complete`

> Body parameter

```json
{
  "reset_password_token": "string",
  "action": "email_code",
  "value": "string",
  "secret": "string"
}
```

<h3 id="recoverycontroller_completeaffirmation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RecoveryCompleteAffirmationRequest](#schemarecoverycompleteaffirmationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "reset_password_token": "string",
  "required_actions": [
    "email"
  ]
}
```

<h3 id="recoverycontroller_completeaffirmation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RecoveryCompleteAffirmationResponse](#schemarecoverycompleteaffirmationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RecoveryController_complete

<a id="opIdRecoveryController_complete"></a>

> Code samples

`POST /recovery/password/reset/complete`

> Body parameter

```json
{
  "reset_password_token": "string"
}
```

<h3 id="recoverycontroller_complete-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CompleteResetPasswordRequest](#schemacompleteresetpasswordrequest)|true|none|

> Example responses

> 400 Response

```json
{
  "failure_code": "BAD_REQUEST",
  "failure_message": "string"
}
```

<h3 id="recoverycontroller_complete-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RecoveryController_resend

<a id="opIdRecoveryController_resend"></a>

> Code samples

`POST /recovery/password/reset/affirmation/resend`

> Body parameter

```json
{
  "token": "string"
}
```

<h3 id="recoverycontroller_resend-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ResendRequest](#schemaresendrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}
```

<h3 id="recoverycontroller_resend-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[ResendResponse](#schemaresendresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## RecoveryController_refresh

<a id="opIdRecoveryController_refresh"></a>

> Code samples

`POST /recovery/refresh/access`

> Body parameter

```json
{
  "refresh_token": "string"
}
```

<h3 id="recoverycontroller_refresh-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[RefreshAccessRequest](#schemarefreshaccessrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "string"
}
```

<h3 id="recoverycontroller_refresh-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[RefreshAccessResponse](#schemarefreshaccessresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="iam-authentication">Authentication</h1>

## AuthenticationController_initAuthentication

<a id="opIdAuthenticationController_initAuthentication"></a>

> Code samples

`POST /authentication/init`

> Body parameter

```json
{
  "action": "email",
  "value": "string",
  "secret": "string"
}
```

<h3 id="authenticationcontroller_initauthentication-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[InitAuthenticationRequest](#schemainitauthenticationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "auth_token": "string",
  "required_actions": [
    "email"
  ]
}
```

<h3 id="authenticationcontroller_initauthentication-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[InitAuthenticationResponse](#schemainitauthenticationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## AuthenticationController_initAffirmation

<a id="opIdAuthenticationController_initAffirmation"></a>

> Code samples

`POST /authentication/affirmation/init`

> Body parameter

```json
{
  "auth_token": "string",
  "action": "email"
}
```

<h3 id="authenticationcontroller_initaffirmation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AuthenticationInitAffirmationRequest](#schemaauthenticationinitaffirmationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "auth_token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}
```

<h3 id="authenticationcontroller_initaffirmation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[AuthenticationInitAffirmationResponse](#schemaauthenticationinitaffirmationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## AuthenticationController_confirmAffirmation

<a id="opIdAuthenticationController_confirmAffirmation"></a>

> Code samples

`POST /authentication/affirmation/complete`

> Body parameter

```json
{
  "auth_token": "string",
  "action": "email_code",
  "value": "string"
}
```

<h3 id="authenticationcontroller_confirmaffirmation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[AuthenticationCompleteAffirmationRequest](#schemaauthenticationcompleteaffirmationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "auth_token": "string",
  "required_actions": [
    "email"
  ]
}
```

<h3 id="authenticationcontroller_confirmaffirmation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[AuthenticationCompleteAffirmationResponse](#schemaauthenticationcompleteaffirmationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## AuthenticationController_confirmAuthentication

<a id="opIdAuthenticationController_confirmAuthentication"></a>

> Code samples

`POST /authentication/complete`

> Body parameter

```json
{
  "auth_token": "string"
}
```

<h3 id="authenticationcontroller_confirmauthentication-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[CompleteAuthenticationRequest](#schemacompleteauthenticationrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "string"
}
```

<h3 id="authenticationcontroller_confirmauthentication-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[CompleteAuthenticationResponse](#schemacompleteauthenticationresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

## AuthenticationController_resend

<a id="opIdAuthenticationController_resend"></a>

> Code samples

`POST /authentication/affirmation/resend`

> Body parameter

```json
{
  "token": "string"
}
```

<h3 id="authenticationcontroller_resend-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[ResendRequest](#schemaresendrequest)|true|none|

> Example responses

> 200 Response

```json
{
  "token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}
```

<h3 id="authenticationcontroller_resend-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[ResendResponse](#schemaresendresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|BAD_REQUEST|[BadRequestResponse](#schemabadrequestresponse)|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|UNAUTHORIZED|[UnauthorizedResponse](#schemaunauthorizedresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|FORBIDDEN|[ForbiddenResponse](#schemaforbiddenresponse)|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|SERVER_ERROR|[ServerErrorResponse](#schemaservererrorresponse)|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_BadRequestResponse">BadRequestResponse</h2>
<!-- backwards compatibility -->
<a id="schemabadrequestresponse"></a>
<a id="schema_BadRequestResponse"></a>
<a id="tocSbadrequestresponse"></a>
<a id="tocsbadrequestresponse"></a>

```json
{
  "failure_code": "BAD_REQUEST",
  "failure_message": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|failure_code|string|true|none|none|
|failure_message|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|failure_code|BAD_REQUEST|
|failure_code|FORBIDDEN|
|failure_code|SERVER_ERROR|
|failure_code|EXPIRED|
|failure_code|CONFLICT|
|failure_code|UNAUTHORIZED|
|failure_code|CAPTCHA_FAILED|
|failure_code|INCOMPLETE|
|failure_code|VALIDATION_ERROR|

<h2 id="tocS_UnauthorizedResponse">UnauthorizedResponse</h2>
<!-- backwards compatibility -->
<a id="schemaunauthorizedresponse"></a>
<a id="schema_UnauthorizedResponse"></a>
<a id="tocSunauthorizedresponse"></a>
<a id="tocsunauthorizedresponse"></a>

```json
{
  "failure_code": "BAD_REQUEST",
  "failure_message": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|failure_code|string|true|none|none|
|failure_message|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|failure_code|BAD_REQUEST|
|failure_code|FORBIDDEN|
|failure_code|SERVER_ERROR|
|failure_code|EXPIRED|
|failure_code|CONFLICT|
|failure_code|UNAUTHORIZED|
|failure_code|CAPTCHA_FAILED|
|failure_code|INCOMPLETE|
|failure_code|VALIDATION_ERROR|

<h2 id="tocS_ForbiddenResponse">ForbiddenResponse</h2>
<!-- backwards compatibility -->
<a id="schemaforbiddenresponse"></a>
<a id="schema_ForbiddenResponse"></a>
<a id="tocSforbiddenresponse"></a>
<a id="tocsforbiddenresponse"></a>

```json
{
  "failure_code": "BAD_REQUEST",
  "failure_message": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|failure_code|string|true|none|none|
|failure_message|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|failure_code|BAD_REQUEST|
|failure_code|FORBIDDEN|
|failure_code|SERVER_ERROR|
|failure_code|EXPIRED|
|failure_code|CONFLICT|
|failure_code|UNAUTHORIZED|
|failure_code|CAPTCHA_FAILED|
|failure_code|INCOMPLETE|
|failure_code|VALIDATION_ERROR|

<h2 id="tocS_ServerErrorResponse">ServerErrorResponse</h2>
<!-- backwards compatibility -->
<a id="schemaservererrorresponse"></a>
<a id="schema_ServerErrorResponse"></a>
<a id="tocSservererrorresponse"></a>
<a id="tocsservererrorresponse"></a>

```json
{
  "failure_code": "BAD_REQUEST",
  "failure_message": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|failure_code|string|true|none|none|
|failure_message|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|failure_code|BAD_REQUEST|
|failure_code|FORBIDDEN|
|failure_code|SERVER_ERROR|
|failure_code|EXPIRED|
|failure_code|CONFLICT|
|failure_code|UNAUTHORIZED|
|failure_code|CAPTCHA_FAILED|
|failure_code|INCOMPLETE|
|failure_code|VALIDATION_ERROR|

<h2 id="tocS_InitRegistrationResponse">InitRegistrationResponse</h2>
<!-- backwards compatibility -->
<a id="schemainitregistrationresponse"></a>
<a id="schema_InitRegistrationResponse"></a>
<a id="tocSinitregistrationresponse"></a>
<a id="tocsinitregistrationresponse"></a>

```json
{
  "registration_token": "string",
  "required_actions": [
    "email"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|registration_token|string|true|none|none|
|required_actions|[string]|true|none|none|

<h2 id="tocS_RegistrationInitAffirmationRequest">RegistrationInitAffirmationRequest</h2>
<!-- backwards compatibility -->
<a id="schemaregistrationinitaffirmationrequest"></a>
<a id="schema_RegistrationInitAffirmationRequest"></a>
<a id="tocSregistrationinitaffirmationrequest"></a>
<a id="tocsregistrationinitaffirmationrequest"></a>

```json
{
  "registration_token": "string",
  "action": "email",
  "value": "string",
  "captcha": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|registration_token|string|true|none|none|
|action|string|true|none|none|
|value|string|true|none|none|
|captcha|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email|
|action|phone|

<h2 id="tocS_RegistrationInitAffirmationResponse">RegistrationInitAffirmationResponse</h2>
<!-- backwards compatibility -->
<a id="schemaregistrationinitaffirmationresponse"></a>
<a id="schema_RegistrationInitAffirmationResponse"></a>
<a id="tocSregistrationinitaffirmationresponse"></a>
<a id="tocsregistrationinitaffirmationresponse"></a>

```json
{
  "registration_token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|registration_token|string|true|none|none|
|required_actions|[string]|true|none|none|
|resend_date|string|true|none|none|
|mask|string|true|none|none|

<h2 id="tocS_RegistrationCompleteAffirmationRequest">RegistrationCompleteAffirmationRequest</h2>
<!-- backwards compatibility -->
<a id="schemaregistrationcompleteaffirmationrequest"></a>
<a id="schema_RegistrationCompleteAffirmationRequest"></a>
<a id="tocSregistrationcompleteaffirmationrequest"></a>
<a id="tocsregistrationcompleteaffirmationrequest"></a>

```json
{
  "registration_token": "string",
  "action": "email_code",
  "value": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|registration_token|string|true|none|none|
|action|string|true|none|none|
|value|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email_code|
|action|phone_code|

<h2 id="tocS_RegistrationCompleteAffirmationResponse">RegistrationCompleteAffirmationResponse</h2>
<!-- backwards compatibility -->
<a id="schemaregistrationcompleteaffirmationresponse"></a>
<a id="schema_RegistrationCompleteAffirmationResponse"></a>
<a id="tocSregistrationcompleteaffirmationresponse"></a>
<a id="tocsregistrationcompleteaffirmationresponse"></a>

```json
{
  "registration_token": "string",
  "required_actions": [
    "email"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|registration_token|string|true|none|none|
|required_actions|[string]|true|none|none|

<h2 id="tocS_CompleteRegistrationRequest">CompleteRegistrationRequest</h2>
<!-- backwards compatibility -->
<a id="schemacompleteregistrationrequest"></a>
<a id="schema_CompleteRegistrationRequest"></a>
<a id="tocScompleteregistrationrequest"></a>
<a id="tocscompleteregistrationrequest"></a>

```json
{
  "registration_token": "string",
  "secret": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|registration_token|string|true|none|none|
|secret|string|true|none|none|

<h2 id="tocS_CompleteRegistrationResponse">CompleteRegistrationResponse</h2>
<!-- backwards compatibility -->
<a id="schemacompleteregistrationresponse"></a>
<a id="schema_CompleteRegistrationResponse"></a>
<a id="tocScompleteregistrationresponse"></a>
<a id="tocscompleteregistrationresponse"></a>

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|access_token|string|true|none|none|
|refresh_token|string|true|none|none|
|expires_at|string|true|none|none|

<h2 id="tocS_RegistrationResendRequest">RegistrationResendRequest</h2>
<!-- backwards compatibility -->
<a id="schemaregistrationresendrequest"></a>
<a id="schema_RegistrationResendRequest"></a>
<a id="tocSregistrationresendrequest"></a>
<a id="tocsregistrationresendrequest"></a>

```json
{
  "token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|none|

<h2 id="tocS_RegistrationResendResponse">RegistrationResendResponse</h2>
<!-- backwards compatibility -->
<a id="schemaregistrationresendresponse"></a>
<a id="schema_RegistrationResendResponse"></a>
<a id="tocSregistrationresendresponse"></a>
<a id="tocsregistrationresendresponse"></a>

```json
{
  "token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|none|
|required_actions|[string]|true|none|none|
|resend_date|string|true|none|none|

<h2 id="tocS_InitResetPasswordResponse">InitResetPasswordResponse</h2>
<!-- backwards compatibility -->
<a id="schemainitresetpasswordresponse"></a>
<a id="schema_InitResetPasswordResponse"></a>
<a id="tocSinitresetpasswordresponse"></a>
<a id="tocsinitresetpasswordresponse"></a>

```json
{
  "reset_password_token": "string",
  "required_actions": [
    "email"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|reset_password_token|string|true|none|none|
|required_actions|[string]|true|none|none|

<h2 id="tocS_RecoveryInitAffirmationRequest">RecoveryInitAffirmationRequest</h2>
<!-- backwards compatibility -->
<a id="schemarecoveryinitaffirmationrequest"></a>
<a id="schema_RecoveryInitAffirmationRequest"></a>
<a id="tocSrecoveryinitaffirmationrequest"></a>
<a id="tocsrecoveryinitaffirmationrequest"></a>

```json
{
  "reset_password_token": "string",
  "action": "email",
  "value": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|reset_password_token|string|true|none|none|
|action|string|true|none|none|
|value|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email|
|action|phone|

<h2 id="tocS_RecoveryInitAffirmationResponse">RecoveryInitAffirmationResponse</h2>
<!-- backwards compatibility -->
<a id="schemarecoveryinitaffirmationresponse"></a>
<a id="schema_RecoveryInitAffirmationResponse"></a>
<a id="tocSrecoveryinitaffirmationresponse"></a>
<a id="tocsrecoveryinitaffirmationresponse"></a>

```json
{
  "reset_password_token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|reset_password_token|string|true|none|none|
|required_actions|[string]|true|none|none|
|resend_date|string|true|none|none|
|mask|string|true|none|none|

<h2 id="tocS_RecoveryCompleteAffirmationRequest">RecoveryCompleteAffirmationRequest</h2>
<!-- backwards compatibility -->
<a id="schemarecoverycompleteaffirmationrequest"></a>
<a id="schema_RecoveryCompleteAffirmationRequest"></a>
<a id="tocSrecoverycompleteaffirmationrequest"></a>
<a id="tocsrecoverycompleteaffirmationrequest"></a>

```json
{
  "reset_password_token": "string",
  "action": "email_code",
  "value": "string",
  "secret": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|reset_password_token|string|true|none|none|
|action|string|true|none|none|
|value|string|true|none|none|
|secret|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email_code|
|action|phone_code|

<h2 id="tocS_RecoveryCompleteAffirmationResponse">RecoveryCompleteAffirmationResponse</h2>
<!-- backwards compatibility -->
<a id="schemarecoverycompleteaffirmationresponse"></a>
<a id="schema_RecoveryCompleteAffirmationResponse"></a>
<a id="tocSrecoverycompleteaffirmationresponse"></a>
<a id="tocsrecoverycompleteaffirmationresponse"></a>

```json
{
  "reset_password_token": "string",
  "required_actions": [
    "email"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|reset_password_token|string|true|none|none|
|required_actions|[string]|true|none|none|

<h2 id="tocS_CompleteResetPasswordRequest">CompleteResetPasswordRequest</h2>
<!-- backwards compatibility -->
<a id="schemacompleteresetpasswordrequest"></a>
<a id="schema_CompleteResetPasswordRequest"></a>
<a id="tocScompleteresetpasswordrequest"></a>
<a id="tocscompleteresetpasswordrequest"></a>

```json
{
  "reset_password_token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|reset_password_token|string|true|none|none|

<h2 id="tocS_ResendRequest">ResendRequest</h2>
<!-- backwards compatibility -->
<a id="schemaresendrequest"></a>
<a id="schema_ResendRequest"></a>
<a id="tocSresendrequest"></a>
<a id="tocsresendrequest"></a>

```json
{
  "token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|none|

<h2 id="tocS_ResendResponse">ResendResponse</h2>
<!-- backwards compatibility -->
<a id="schemaresendresponse"></a>
<a id="schema_ResendResponse"></a>
<a id="tocSresendresponse"></a>
<a id="tocsresendresponse"></a>

```json
{
  "token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|token|string|true|none|none|
|required_actions|[string]|true|none|none|
|resend_date|string|true|none|none|
|mask|string|true|none|none|

<h2 id="tocS_RefreshAccessRequest">RefreshAccessRequest</h2>
<!-- backwards compatibility -->
<a id="schemarefreshaccessrequest"></a>
<a id="schema_RefreshAccessRequest"></a>
<a id="tocSrefreshaccessrequest"></a>
<a id="tocsrefreshaccessrequest"></a>

```json
{
  "refresh_token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|refresh_token|string|true|none|none|

<h2 id="tocS_RefreshAccessResponse">RefreshAccessResponse</h2>
<!-- backwards compatibility -->
<a id="schemarefreshaccessresponse"></a>
<a id="schema_RefreshAccessResponse"></a>
<a id="tocSrefreshaccessresponse"></a>
<a id="tocsrefreshaccessresponse"></a>

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|access_token|string|true|none|none|
|refresh_token|string|true|none|none|
|expires_at|string|true|none|none|

<h2 id="tocS_InitAuthenticationRequest">InitAuthenticationRequest</h2>
<!-- backwards compatibility -->
<a id="schemainitauthenticationrequest"></a>
<a id="schema_InitAuthenticationRequest"></a>
<a id="tocSinitauthenticationrequest"></a>
<a id="tocsinitauthenticationrequest"></a>

```json
{
  "action": "email",
  "value": "string",
  "secret": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|action|string|true|none|none|
|value|string|true|none|none|
|secret|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email|
|action|phone|

<h2 id="tocS_InitAuthenticationResponse">InitAuthenticationResponse</h2>
<!-- backwards compatibility -->
<a id="schemainitauthenticationresponse"></a>
<a id="schema_InitAuthenticationResponse"></a>
<a id="tocSinitauthenticationresponse"></a>
<a id="tocsinitauthenticationresponse"></a>

```json
{
  "auth_token": "string",
  "required_actions": [
    "email"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|auth_token|string|true|none|none|
|required_actions|[string]|true|none|none|

<h2 id="tocS_AuthenticationInitAffirmationRequest">AuthenticationInitAffirmationRequest</h2>
<!-- backwards compatibility -->
<a id="schemaauthenticationinitaffirmationrequest"></a>
<a id="schema_AuthenticationInitAffirmationRequest"></a>
<a id="tocSauthenticationinitaffirmationrequest"></a>
<a id="tocsauthenticationinitaffirmationrequest"></a>

```json
{
  "auth_token": "string",
  "action": "email"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|auth_token|string|true|none|none|
|action|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email|
|action|phone|

<h2 id="tocS_AuthenticationInitAffirmationResponse">AuthenticationInitAffirmationResponse</h2>
<!-- backwards compatibility -->
<a id="schemaauthenticationinitaffirmationresponse"></a>
<a id="schema_AuthenticationInitAffirmationResponse"></a>
<a id="tocSauthenticationinitaffirmationresponse"></a>
<a id="tocsauthenticationinitaffirmationresponse"></a>

```json
{
  "auth_token": "string",
  "required_actions": [
    "email_code"
  ],
  "resend_date": "string",
  "mask": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|auth_token|string|true|none|none|
|required_actions|[string]|true|none|none|
|resend_date|string|true|none|none|
|mask|string|true|none|none|

<h2 id="tocS_AuthenticationCompleteAffirmationRequest">AuthenticationCompleteAffirmationRequest</h2>
<!-- backwards compatibility -->
<a id="schemaauthenticationcompleteaffirmationrequest"></a>
<a id="schema_AuthenticationCompleteAffirmationRequest"></a>
<a id="tocSauthenticationcompleteaffirmationrequest"></a>
<a id="tocsauthenticationcompleteaffirmationrequest"></a>

```json
{
  "auth_token": "string",
  "action": "email_code",
  "value": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|auth_token|string|true|none|none|
|action|string|true|none|none|
|value|string|true|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|action|email_code|
|action|phone_code|

<h2 id="tocS_AuthenticationCompleteAffirmationResponse">AuthenticationCompleteAffirmationResponse</h2>
<!-- backwards compatibility -->
<a id="schemaauthenticationcompleteaffirmationresponse"></a>
<a id="schema_AuthenticationCompleteAffirmationResponse"></a>
<a id="tocSauthenticationcompleteaffirmationresponse"></a>
<a id="tocsauthenticationcompleteaffirmationresponse"></a>

```json
{
  "auth_token": "string",
  "required_actions": [
    "email"
  ]
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|auth_token|string|true|none|none|
|required_actions|[string]|true|none|none|

<h2 id="tocS_CompleteAuthenticationRequest">CompleteAuthenticationRequest</h2>
<!-- backwards compatibility -->
<a id="schemacompleteauthenticationrequest"></a>
<a id="schema_CompleteAuthenticationRequest"></a>
<a id="tocScompleteauthenticationrequest"></a>
<a id="tocscompleteauthenticationrequest"></a>

```json
{
  "auth_token": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|auth_token|string|true|none|none|

<h2 id="tocS_CompleteAuthenticationResponse">CompleteAuthenticationResponse</h2>
<!-- backwards compatibility -->
<a id="schemacompleteauthenticationresponse"></a>
<a id="schema_CompleteAuthenticationResponse"></a>
<a id="tocScompleteauthenticationresponse"></a>
<a id="tocscompleteauthenticationresponse"></a>

```json
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|access_token|string|true|none|none|
|refresh_token|string|true|none|none|
|expires_at|string|true|none|none|

