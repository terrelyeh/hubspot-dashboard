# HubSpot Integration Setup Guide

This guide will help you connect your HubSpot CRM to the Pipeline Dashboard to display real-time deal data.

## 📋 Prerequisites

- A HubSpot account with CRM access
- Admin permissions to create Private Apps in HubSpot
- This dashboard running locally or deployed

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a HubSpot Private App

1. Log in to your HubSpot account
2. Navigate to **Settings** (gear icon in top right)
3. Go to **Integrations → Private Apps**
4. Click **Create a private app**
5. Fill in the app details:
   - **Name**: Pipeline Dashboard
   - **Description**: Sales pipeline analytics dashboard
   - **Logo**: (optional)

### Step 2: Configure Scopes

In the **Scopes** tab, grant the following permissions:

#### Required Scopes:
- ✅ `crm.objects.deals.read` - Read deals
- ✅ `crm.objects.owners.read` - Read deal owners
- ✅ `crm.schemas.deals.read` - Read deal pipelines and stages

#### Optional (for future features):
- `crm.objects.companies.read` - Read company data
- `crm.objects.contacts.read` - Read contact data

### Step 3: Generate Access Token

1. Click **Create app** at the bottom
2. Copy the generated **Access Token** (starts with `pat-na1-...`)
3. ⚠️ **Save this token securely** - you can't view it again!

### Step 4: Add Token to Your Dashboard

**Option A: Using the UI** (Recommended)
1. In your dashboard, click the **Settings** (⚙️) icon in the header
2. Go to **HubSpot Integration**
3. Paste your Access Token
4. Click **Test Connection** to verify
5. Click **Sync Now** to import your deals

**Option B: Using Environment Variables**
1. Open `.env.local` in your project root
2. Add your token:
   ```env
   HUBSPOT_API_KEY="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
   ```
3. Restart your dev server:
   ```bash
   npm run dev
   ```

### Step 5: Sync Your Data

1. Go to **Settings → HubSpot Integration**
2. Click **Sync Now**
3. Wait for the sync to complete (usually < 1 minute for <1000 deals)
4. Return to the dashboard to see your live data! 🎉

## 🔧 Configuration Options

### Feature Flags

Control HubSpot integration behavior in `.env.local`:

```env
# Use mock data (for development/demo)
ENABLE_MOCK_DATA="true"

# Allow real HubSpot sync
ENABLE_REAL_HUBSPOT_SYNC="false"
```

### Multi-Region Setup

If you have multiple HubSpot portals for different regions:

```env
# Global/default API key
HUBSPOT_API_KEY="pat-na1-..."

# Region-specific keys
HUBSPOT_API_KEY_US="pat-na1-..."
HUBSPOT_API_KEY_APAC="pat-na1-..."
HUBSPOT_API_KEY_EU="pat-na1-..."
```

## 📊 What Data Gets Synced?

The dashboard syncs the following from HubSpot:

### Deals
- Deal name
- Amount (in USD)
- Deal stage
- Pipeline
- Close date
- Created date
- Last modified date
- Deal owner
- Stage probability
- Forecast category

### Owners
- Owner name
- Owner email

### Pipelines
- Pipeline stages
- Stage probabilities

## 🔄 Sync Schedule

### Manual Sync
- Go to **Settings → HubSpot Integration**
- Click **Sync Now**

### Automatic Sync (Coming Soon)
- Scheduled syncs every 15 minutes
- Webhook support for real-time updates

## ✅ Verify Your Setup

Run these checks to ensure everything is working:

1. **Test Connection**
   - Go to Settings → HubSpot Integration
   - Click "Test Connection"
   - Should see: "✅ Successfully connected to HubSpot API"

2. **Check Sync Status**
   - After syncing, you should see:
     - Created: X deals
     - Updated: Y deals
   - No errors in the error log

3. **View Dashboard**
   - Return to the main dashboard
   - You should see real deal data
   - Demo Mode banner should disappear (if `ENABLE_MOCK_DATA="false"`)

## 🐛 Troubleshooting

### "API key not found" error
- Make sure `HUBSPOT_API_KEY` is set in `.env.local`
- Restart your dev server after adding the key
- Check for typos in the token

### "403 Forbidden" error
- Verify your Private App has the correct scopes
- Check that the token hasn't been revoked in HubSpot

### "No deals synced"
- Verify you have deals in HubSpot
- Check the close date range (dashboard shows current quarter by default)
- Try filtering by "All Stages" to see all deals

### Data not showing in dashboard
- Make sure you've run the sync successfully
- Check `ENABLE_MOCK_DATA` is set to `false` in `.env.local`
- Refresh the browser page

## 🔐 Security Best Practices

1. **Never commit API keys** to version control
   - `.env.local` is already in `.gitignore`
   - Use environment variables in production

2. **Use Private Apps** (not API keys)
   - More secure than legacy API keys
   - Granular permission control
   - Easier to rotate/revoke

3. **Rotate tokens regularly**
   - Create a new Private App every 6-12 months
   - Delete old apps after migration

4. **Limit scope access**
   - Only grant the minimum required scopes
   - Review permissions periodically

## 📚 Additional Resources

- [HubSpot Private Apps Documentation](https://developers.hubspot.com/docs/api/private-apps)
- [HubSpot CRM API Reference](https://developers.hubspot.com/docs/api/crm/deals)
- [OAuth Scopes Guide](https://developers.hubspot.com/docs/api/working-with-oauth)

## 💡 Tips

- **First Sync**: The initial sync may take longer (1-2 minutes for 1000+ deals)
- **Incremental Updates**: Subsequent syncs are faster as they only update changed deals
- **Data Accuracy**: Sync regularly to keep dashboard data up-to-date
- **Testing**: Use a HubSpot sandbox account for testing if available

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Review the sync log in Settings → HubSpot Integration
3. Verify your HubSpot Private App settings
4. Ensure all required scopes are granted

---

**Ready to go?** Head to Settings → HubSpot Integration and start syncing! 🚀
