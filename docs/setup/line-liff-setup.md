# LINE Login & LIFF Setup Guide

## 1. Create a Channel (LINE Login)
1. Go to [LINE Developers Console](https://developers.line.biz/console/).
2. Log in with your LINE account.
3. Click **Create a new provider** (e.g., "Smart Rent Dev").
4. Click **Create a new channel** > **LINE Login**.
   - **Channel Type**: LINE Login
   - **Provider**: Choose the one you created.
   - **Region**: Thailand
   - **Channel Name**: Smart Rent & Share (Local)
   - **Channel Description**: Student rental platform.
   - **App Type**: Web app
5. Agree to terms and create.

## 2. Configure Channel Settings
1. Go to the **Basic Settings** tab.
   - Copy **Channel ID** -> Paste to `apps/api/.env` (`LINE_CHANNEL_ID`).
   - Copy **Channel Secret** -> Paste to `apps/api/.env` (`LINE_CHANNEL_SECRET`).
2. Go to the **App settings** tab (if available) or **LINE Login** tab.
   - **Callback URL**: `http://localhost:3000/api/auth/callback/line` (NextAuth default) or your custom endpoint.
   - *Note*: exact callback path depends on our implementation. For now, add `http://localhost:3000`.

## 3. Create a LIFF App
1. Go to the **LIFF** tab.
2. Click **Add**.
   - **LIFF App Name**: Smart Rent App
   - **Size**: Full
   - **Endpoint URL**: `http://localhost:3000`
     - *Note*: LINE allows `http://localhost` for development. specific paths are optional (e.g. `http://localhost:3000/app`).
   - **Scopes**: Select `profile`, `openid`, `chat_message.write` (optional).
     - *Important*: Ensure `openid` is selected for authentication.
   - **Bot link feature**: On (Normal).
3. Click **Add**.

## 4. Get LIFF ID
1. Once created, copy the **LIFF ID** (format: `12345678-AbCdEfGh`).
2. Paste it into `apps/web/.env.local` (`NEXT_PUBLIC_LIFF_ID`).

## 5. Mobile Testing (Optional but Recommended)
To test on a real mobile device, `localhost` won't work.
1. Use **ngrok** to expose your port: `ngrok http 3000`.
2. Update the **LIFF Endpoint URL** in LINE Console to your https ngrok URL (e.g. `https://xxxx-xx-xx.ngrok-free.app`).
3. Update `NEXT_PUBLIC_API_URL` in `.env.local` if needed.
