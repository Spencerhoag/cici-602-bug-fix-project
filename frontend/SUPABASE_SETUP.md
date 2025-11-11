# Supabase Authentication Setup

This guide will help you set up Supabase authentication for the CICI frontend.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the project details:
   - **Name**: CICI (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
5. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is created, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Step 3: Configure Your .env File

1. Open `frontend/.env` in your editor
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 4: Configure Email Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Email** in the list
3. Make sure it's **enabled**
4. Scroll down to **Email Templates** (optional but recommended):
   - You can customize the confirmation email
   - You can customize the reset password email

### Email Confirmation Settings

By default, Supabase requires email confirmation. You have two options:

**Option 1: Disable email confirmation (for development)**
1. Go to **Authentication** → **Settings**
2. Scroll to **Email Auth**
3. Turn OFF "Enable email confirmations"
4. Users can sign up and log in immediately

**Option 2: Keep email confirmation enabled (recommended for production)**
- Users will receive a confirmation email
- They must click the link before they can log in
- For local development, check the Supabase logs to see the confirmation link

## Step 5: Test Your Setup

1. Make sure your backend is running:
   ```bash
   docker compose up -d
   ```

2. Start the frontend (from the `frontend` directory):
   ```bash
   deno task dev
   ```

3. Open http://localhost:3000 in your browser

4. You should see the authentication page with Sign In / Sign Up tabs

5. Try creating an account:
   - Enter an email and password
   - If email confirmation is disabled: You'll be logged in immediately
   - If email confirmation is enabled: Check your email for the confirmation link

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env` file exists in the `frontend/` directory
- Check that the variable names start with `VITE_` (not `REACT_APP_` or `NEXT_PUBLIC_`)
- Restart your dev server after changing `.env`

### Email not sending
- Check your Supabase project's email settings
- For development, you can disable email confirmation (see above)
- Check the Supabase dashboard → Authentication → Logs for email delivery status

### Can't log in after signing up
- If email confirmation is enabled, you need to click the confirmation link first
- Check the Supabase dashboard → Authentication → Users to see user status
- Try disabling email confirmation for development

## What's Included

The authentication setup includes:

✅ **Sign Up**: Create new user accounts with email/password
✅ **Sign In**: Login with existing accounts
✅ **Sign Out**: Logout functionality
✅ **Protected Routes**: Users must be logged in to access the app
✅ **User Context**: Access current user information anywhere in the app
✅ **Loading States**: Shows loading spinner while checking authentication

## Next Steps

Once authentication is working:
- Users will be automatically logged in on subsequent visits
- Their session persists across browser refreshes
- You can access user info with `useAuth()` hook anywhere in the app
- Projects and issues will be associated with the logged-in user (when you add that)
