# Setting Up Google Cloud MCP Server in Kiro

Google provides an official **Cloud CLI remote MCP server** that lets you execute `gcloud` and `bq` commands through natural language in Kiro!

## What You Can Do With It

Once set up, you can ask Kiro to:
- Create Google OAuth credentials
- Manage Google Cloud projects
- Configure Cloud services
- List and manage resources
- Execute `gcloud` commands
- Execute BigQuery `bq` commands

---

## Step 1: Enable the Cloud CLI Execution API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one)
3. Go to **APIs & Services → Library**
4. Search for **"Cloud CLI Execution API"**
5. Click **Enable**

Or use this direct link:
https://console.cloud.google.com/apis/library/cloudcli.googleapis.com

---

## Step 2: Set Up Authentication

The MCP server uses OAuth 2.0 for authentication. You have two options:

### Option A: Use Your Personal Google Account (Recommended for testing)

This is the simplest way to get started.

### Option B: Create a Service Account (Recommended for production)

1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name it: `kiro-mcp-client`
4. Grant role: **MCP Tool User** (`roles/mcp.toolUser`)
5. Click **Done**
6. Click on the service account
7. Go to **Keys** tab
8. Click **Add Key → Create new key**
9. Choose **JSON**
10. Save the JSON file securely

---

## Step 3: Configure MCP in Kiro

Now let's add the Google Cloud CLI MCP server to your Kiro MCP configuration.

### For User-level (all workspaces)

Create or edit: `~/.kiro/settings/mcp.json`

### For Workspace-level (this project only)

Create or edit: `.kiro/settings/mcp.json`

---

## Step 4: Add the MCP Server Configuration

Here's the configuration to add:

```json
{
  "mcpServers": {
    "google-cloud-cli": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-oauth",
        "https://cloudcli.googleapis.com/mcp",
        "YOUR_OAUTH_CLIENT_ID",
        "YOUR_OAUTH_CLIENT_SECRET"
      ],
      "env": {
        "OAUTH_SCOPES": "https://www.googleapis.com/auth/cloud-platform"
      },
      "disabled": false
    }
  }
}
```

### Getting OAuth Client ID and Secret

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services → Credentials**
4. Click **+ CREATE CREDENTIALS**
5. Select **OAuth client ID**
6. Application type: **Web application**
7. Name: `Kiro MCP Client`
8. **Authorized redirect URIs** - Add:
   ```
   http://localhost:3000/oauth/callback
   ```
9. Click **CREATE**
10. Copy the **Client ID** and **Client Secret**
11. Replace in the config above

---

## Alternative: Direct Authentication (Simpler but less secure)

If you have `gcloud` CLI installed and authenticated, you can use this simpler config:

```json
{
  "mcpServers": {
    "google-cloud-cli": {
      "command": "npx",
      "args": [
        "-y",
        "@google-cloud/mcp-server-gcloud"
      ],
      "env": {},
      "disabled": false
    }
  }
}
```

This uses your existing `gcloud auth login` credentials.

---

## Step 5: Install Prerequisites

The MCP server requires Node.js to be installed. Let's check:

```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org

---

## Step 6: Test the Connection

1. Save your `mcp.json` configuration
2. Restart Kiro or reload the window
3. The MCP server should auto-connect
4. Check the **MCP Servers** view in Kiro sidebar

---

## Step 7: Try It Out!

Once connected, you can ask Kiro things like:

- "List all my Google Cloud projects"
- "Create a new OAuth client ID for my web application"
- "Show me the Cloud SQL instances in my project"
- "Enable the Cloud Storage API"

---

## Available Tools

The Google Cloud CLI MCP server provides:

1. **run_gcloud_command** - Execute any `gcloud` command
2. **run_bq_command** - Execute BigQuery `bq` commands

### Example Usage

**Create OAuth Credentials:**
```
"Create an OAuth client ID for a web application named SyncSenta-Production 
with redirect URIs https://sentastudio.vercel.app/auth/callback 
and https://[my-supabase-project].supabase.co/auth/v1/callback"
```

Kiro will execute:
```bash
gcloud auth application-default oauth-clients create web SyncSenta-Production \
  --redirect-uris=https://sentastudio.vercel.app/auth/callback,https://[...].supabase.co/auth/v1/callback
```

---

## Troubleshooting

### Error: "Command 'gcloud' not recognized"

The MCP server doesn't require `gcloud` CLI to be installed locally. It runs commands remotely on Google's infrastructure.

### Error: "Authentication failed"

1. Verify OAuth client ID and secret are correct
2. Check that redirect URI matches exactly
3. Ensure Cloud CLI Execution API is enabled
4. Verify you have `roles/mcp.toolUser` permission

### Error: "Command not supported"

Some gcloud commands are blocked for security:
- `gcloud auth`
- `gcloud config`
- `gcloud init`
- `gcloud iam service-accounts` (some operations)

Use the web console for these operations.

### MCP Server Won't Connect

1. Check Node.js is installed: `node --version`
2. Verify `mcp.json` syntax is valid (no trailing commas)
3. Check Kiro logs: **View → Output → Kiro MCP**
4. Try restarting Kiro

---

## Security Best Practices

1. **Use Service Accounts for Production**
   - Create dedicated service accounts
   - Grant minimum required permissions
   - Rotate keys regularly

2. **Restrict OAuth Scopes**
   - Only grant necessary scopes
   - Default scope: `https://www.googleapis.com/auth/cloud-platform`

3. **Use Project-Specific Configs**
   - Store configs in `.kiro/settings/mcp.json` (per project)
   - Don't commit credentials to Git (add to `.gitignore`)

4. **Monitor Usage**
   - Check Cloud Audit Logs
   - Review MCP tool calls
   - Set up billing alerts

---

## What This Solves for SyncSenta

With Google Cloud MCP configured, you can:

✅ **Create OAuth credentials** directly from Kiro
✅ **Configure Google sign-in** without leaving the editor
✅ **Manage Supabase deployment** (if hosted on GCP)
✅ **Monitor API usage** and quotas
✅ **Debug authentication issues** with real-time logs
✅ **Automate deployment** tasks with natural language

---

## Full Example: Setting Up Google OAuth

Here's a complete workflow using the MCP server:

**Your request to Kiro:**
> "I need to set up Google OAuth for SyncSenta. Create an OAuth client for my web app with these redirect URIs:
> - https://sentastudio.vercel.app/auth/callback  
> - https://abcdefg.supabase.co/auth/v1/callback
> 
> Then show me the client ID and secret."

**What Kiro does:**
1. Calls `run_gcloud_command` with OAuth client creation
2. Retrieves the credentials
3. Shows you the Client ID and Client Secret
4. Reminds you to add them to Supabase Dashboard

**Result:**
You get OAuth credentials without ever leaving your editor!

---

## Next Steps

After setting up the MCP server:

1. **Configure Google OAuth** for SyncSenta (use the credentials)
2. **Add to Supabase Dashboard** (Authentication → Providers → Google)
3. **Test the sign-up flow** at https://sentastudio.vercel.app/auth/signup
4. **Monitor usage** in Cloud Console

---

## Resources

- [Google Cloud MCP Documentation](https://cloud.google.com/mcp/docs)
- [Cloud CLI MCP Reference](https://cloud.google.com/sdk/use-gcloud-mcp)
- [MCP Specification](https://modelcontextprotocol.io)
- [Kiro MCP Setup Guide](https://docs.kiro.dev/mcp)

---

**Setup Guide Version**: 1.0  
**Date**: September 2, 2026  
**Status**: Ready to use (API is in Preview)
