# Google sign-in setup

Maowi signs users in with Google Identity Services. The browser receives a
signed ID token from Google, and the API verifies it before issuing the normal
session cookie. There is no server-side redirect and no client secret.

## 1. Create an OAuth client

1. Open the Google Cloud Console and create (or pick) a project.
2. Configure the OAuth consent screen under "APIs & Services". Add the domains
   you serve the app from.
3. Go to "APIs & Services" > "Credentials" > "Create credentials" > "OAuth
   client ID".
4. Choose "Web application".
5. Under "Authorized JavaScript origins" add every origin the app is served
   from:
   - `http://localhost:5173` for local development
   - your production origin, for example `https://maowi.example`
   Do not add an authorized redirect URI: this flow does not use one.
6. Copy the generated client ID. There is no client secret to copy.

## 2. Configure the environments

Backend `.env`:

```
GOOGLE_CLIENT_ID=<client id>
```

Frontend `src/ui/.env`:

```
VITE_GOOGLE_CLIENT_ID=<client id>
```

Both values are the same client ID. The backend refuses to start without
`GOOGLE_CLIENT_ID`, and the button is not configured without
`VITE_GOOGLE_CLIENT_ID`. Restart the Vite dev server after changing it.

## Troubleshooting

- The Google button does not appear: check that the current origin is listed
  under Authorized JavaScript origins.
- `Invalid Google credential`: the token was expired, was issued for a different
  client ID, or was tampered with.
- `Google email not verified`: Google reports the account email as unverified,
  so the sign-in is refused.
