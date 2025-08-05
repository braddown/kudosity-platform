# Kudosity MCP Server

A production-ready Model Context Protocol (MCP) server that provides AI agents with seamless access to Kudosity's SMS and messaging APIs. This server eliminates the complexity of API integration by providing intelligent tools with automatic validation, error handling, and user-friendly responses.

## 🎯 **Problem Solved**

**Before:** AI coding agents struggle with SMS API integration due to:
- Complex authentication methods
- Confusing API payload formats  
- Cryptic error messages
- Manual phone number formatting
- Lack of validation feedback

**After:** With Kudosity MCP Server:
- ✅ **Automatic authentication** handling
- ✅ **Intelligent phone number** formatting (E.164)
- ✅ **Clear, actionable error** messages
- ✅ **Built-in validation** and guidance
- ✅ **Natural language** interaction

## 🚀 **Features**

### **SMS Operations**
- **Send SMS** - Send individual messages with automatic validation
- **Get SMS** - Retrieve message details and delivery status
- **List SMS** - Browse messages with filtering and pagination

### **Webhook Management**
- **Create Webhook** - Set up real-time event notifications
- **Update Webhook** - Modify webhook configuration
- **Delete Webhook** - Remove webhook subscriptions

### **Campaign Management**
- **Get Campaign** - View campaign details and metrics

### **Smart Features**
- 📱 **Flexible phone number formats** - Accepts +61412345678, 61412345678, +1234567890, 1234567890
- 🏷️ **Default sender ID** - Configure once, use everywhere (no need to specify sender each time)
- 🔍 **Message analysis** (encoding, segments, character count)
- ⚡ **Intelligent error handling** with actionable guidance
- 🛡️ **Input validation** with helpful feedback
- 📊 **Rich response formatting** for easy reading

## 📦 **Installation**

### **For End Users (Recommended)**
```bash
npm install -g @kudosity/mcp-server
```

### **From Source**
```bash
git clone https://github.com/kudosity/mcp-server.git
cd mcp-server
npm install
npm run build
npm link
```

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Required
KUDOSITY_API_KEY=your_api_key_here

# Optional
KUDOSITY_DEFAULT_SENDER=YourBrand      # Default sender ID for all SMS
LOG_LEVEL=info                         # error, warn, info, debug
KUDOSITY_TIMEOUT=30000                 # Request timeout in milliseconds
KUDOSITY_RETRY_ATTEMPTS=3              # Number of retry attempts
```

### **MCP Client Configuration**

#### **Claude Desktop**
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "kudosity": {
      "command": "kudosity-mcp-server",
      "env": {
        "KUDOSITY_API_KEY": "your_api_key_here",
        "KUDOSITY_DEFAULT_SENDER": "YourBrand"
      }
    }
  }
}
```

#### **Cursor**
Add to your `mcp.json`:
```json
{
  "mcpServers": {
    "kudosity": {
      "command": "npx",
      "args": ["@kudosity/mcp-server"],
      "env": {
        "KUDOSITY_API_KEY": "your_api_key_here",
        "KUDOSITY_DEFAULT_SENDER": "YourBrand"
      }
    }
  }
}
```

## 🛠️ **Usage Examples**

### **Send SMS**
```
"Send an SMS to 61412345678 with message 'Hello from Kudosity!'"
```
or
```
"Send an SMS to +61412345678 with message 'Hello from Kudosity!'"
```

**Response:**
```
✅ SMS sent successfully!

📱 Recipient: +61412345678
📨 Message ID: msg_abc123
📝 Message: "Hello from Kudosity!"

📊 Message Analysis:
• Length: 22 characters
• Encoding: GSM7
• Segments: 1
• Sender: YourBrand (default)

💡 Use message ID "msg_abc123" to check delivery status.
```

### **Get SMS Status**
```
"Check the status of message msg_abc123"
```

### **Create Webhook**
```
"Create a webhook at https://myapp.com/webhooks for SMS delivery events"
```

### **List Recent Messages**
```
"Show me the last 10 SMS messages sent today"
```

## 🔧 **API Endpoints Used**

This MCP server uses Kudosity's Modern API (v2):

- `POST /v2/sms` - Send SMS messages
- `GET /v2/sms/{id}` - Get SMS details  
- `GET /v2/sms` - List SMS messages
- `POST /v2/webhook` - Create webhooks
- `PUT /v2/webhook/{id}` - Update webhooks
- `DELETE /v2/webhook/{id}` - Delete webhooks
- `GET /v2/campaigns/{id}` - Get campaign details

## 🧪 **Testing**

### **Manual Testing**
```bash
# Set your API key
export KUDOSITY_API_KEY="your_real_api_key"

# Test the server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | kudosity-mcp-server
```

### **With MCP Client**
1. Configure your MCP client (Claude Desktop, Cursor, etc.)
2. Restart the client
3. Try: "Send a test SMS to +1234567890"

## 🔍 **Troubleshooting**

### **Server Not Appearing in MCP Client**
1. Check that `KUDOSITY_API_KEY` is set correctly
2. Verify the command path in your MCP configuration
3. Restart your MCP client completely
4. Check logs with `LOG_LEVEL=debug`

### **Authentication Errors**
1. Verify your API key is correct and active
2. Check that your account has SMS sending permissions
3. Ensure you're using the Modern API key (not Legacy)

### **SMS Sending Failures**
1. Verify phone numbers are in international format (+country code)
2. Check your account balance and sending limits
3. Ensure the recipient number is valid and can receive SMS

### **Debug Logging**
```bash
# Enable debug logging
export LOG_LEVEL=debug
export KUDOSITY_API_KEY="your_key"
kudosity-mcp-server
```

## 📚 **Documentation**

- **Kudosity API Docs:** https://developers.kudosity.com
- **MCP Protocol:** https://modelcontextprotocol.io
- **GitHub Repository:** https://github.com/kudosity/mcp-server

## 🤝 **Support**

- **Issues:** https://github.com/kudosity/mcp-server/issues
- **Email:** support@kudosity.com
- **Documentation:** https://developers.kudosity.com

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 **Why This Matters**

This MCP server transforms Kudosity from "just another SMS API" into **the most AI-agent-friendly messaging platform**. By eliminating integration complexity and providing intelligent assistance, it enables:

- ⚡ **Faster development** - Minutes instead of hours
- 🛡️ **Fewer errors** - Built-in validation and guidance  
- 🤖 **Better AI integration** - Natural language interaction
- 📈 **Higher success rates** - Intelligent error handling

**Perfect for developers building AI-powered applications that need reliable SMS functionality.**

