# self-hosted-widget-webpack sample

By default the app server runs at `http://localhost:8080`. The callback redirect URI is `http://localhost:8080/implicit/callback`

## Commands

If running from the workspace directory, add the `--cwd` option: `yarn --cwd samples/custom-login start`

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `yarn start`          | Starts the app server |

## Configuring via URL parameters

The following config parameters are accepted in the URL as encoded query parameters:

* `clientId` - set the client ID
* `issuer` - set the issuer

Example:

```html
http://localhost:8080/?issuer=https%3A%2F%2Fabc.oktapreview.com%2Foauth2%2Fdefault&clientId=01234567xcdfgC80h7
```
