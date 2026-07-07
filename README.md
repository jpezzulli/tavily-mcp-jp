# Tavily MCP Server
![GitHub Repo stars](https://img.shields.io/github/stars/tavily-ai/tavily-mcp?style=social)
![npm](https://img.shields.io/npm/dt/tavily-mcp)
![smithery badge](https://smithery.ai/badge/@tavily-ai/tavily-mcp)

The Tavily MCP server provides:
- search, extract, map, crawl tools
- Real-time web search capabilities through the tavily-search tool
- Intelligent data extraction from web pages via the tavily-extract tool
- Powerful web mapping tool that creates a structured map of website 
- Web crawler that systematically explores websites 


### 📚 Helpful Resources
- [Tutorial](https://medium.com/@dustin_36183/building-a-knowledge-graph-assistant-combining-tavily-and-neo4j-mcp-servers-with-claude-db92de075df9) on combining Tavily MCP with Neo4j MCP server
- [Tutorial](https://medium.com/@dustin_36183/connect-your-coding-assistant-to-the-web-integrating-tavily-mcp-with-cline-in-vs-code-5f923a4983d1) on integrating Tavily MCP with Cline in VS Code

## Remote MCP Server

Connect directly to Tavily's remote MCP server instead of running it locally. This provides a seamless experience without requiring local installation or configuration.

Simply use the remote MCP server URL with your Tavily API key:

``` 
https://mcp.tavily.com/mcp/?tavilyApiKey=<your-api-key> 
```
 Get your Tavily API key from [tavily.com](https://www.tavily.com/).

Alternatively, you can pass your API key through an Authorization header if the MCP client supports this:

```
Authorization: Bearer <your-api-key>
```
**Note:** When using the remote MCP, you can specify default parameters for all requests by including a `DEFAULT_PARAMETERS` header containing a JSON object with your desired defaults. Example:


```json
{"include_images":true, "search_depth": "basic", "max_results": 10}
```

## Connect to Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's official CLI tool for Claude. You can add the Tavily MCP server using the `claude mcp add` command. There are two ways to authenticate:

#### Option 1: API Key in URL

Pass your API key directly in the URL. Replace `<your-api-key>` with your actual [Tavily API key](https://www.tavily.com/):

```bash
claude mcp add --transport http tavily https://mcp.tavily.com/mcp/?tavilyApiKey=<your-api-key>
```

#### Option 2: OAuth Authentication Flow

Add the server without an API key in the URL:

```bash
claude mcp add --transport http tavily https://mcp.tavily.com/mcp
```

After adding, you'll need to complete the authentication flow:
1. Run `claude` to start Claude Code
2. Type `/mcp` to open the MCP server management
3. Select the Tavily server and complete the authentication process

**Tip:** Add `--scope user` to either command to make the Tavily MCP server available globally across all your projects:

```bash
claude mcp add --transport http --scope user tavily https://mcp.tavily.com/mcp/?tavilyApiKey=<your-api-key>
```

Once configured, you'll have access to the Tavily search, extract, map, and crawl tools.

## Connect to Cursor
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=tavily-remote-mcp&config=eyJjb21tYW5kIjoibnB4IC15IG1jcC1yZW1vdGUgaHR0cHM6Ly9tY3AudGF2aWx5LmNvbS9tY3AvP3RhdmlseUFwaUtleT08eW91ci1hcGkta2V5PiIsImVudiI6e319)

Click the ⬆️ Add to Cursor ⬆️ button, this will do most of the work for you but you will still need to edit the configuration to add your API-KEY. You can get a Tavily API key [here](https://www.tavily.com/).


once you click the button you should be redirect to Cursor ...

### Step 1
Click the install button

![](assets/cursor-step1.png)


### Step 2
You should see the MCP is now installed, if the blue slide is not already turned on, manually turn it on. You also need to edit the configuration to include your own Tavily API key.
![](assets/cursor-step2.png)

### Step 3
You will then be redirected to your `mcp.json` file where you have to add `your-api-key`.

```json
{
  "mcpServers": {
    "tavily-remote-mcp": {
      "command": "npx -y mcp-remote https://mcp.tavily.com/mcp/?tavilyApiKey=<your-api-key>",
      "env": {}
    }
  }
}
```

### Remote MCP Server OAuth Flow

The Tavily Remote MCP server supports secure OAuth authentication, allowing you to connect and authorize seamlessly with compatible clients.

#### How to Set Up OAuth Authentication

**A. Using MCP Inspector:**

* Open the MCP Inspector and click "Open Auth Settings".
* Select the OAuth flow and complete these steps:
   1. Metadata discovery
   2. Client registration
   3. Preparing authorization
   4. Request authorization and obtain the authorization code
   5. Token request
   6. Authentication complete

Once finished, you will receive an access token that lets you securely make authenticated requests to the Tavily Remote MCP server.

**B. Using other MCP Clients (Example: Cursor):**

You can configure your MCP client to use OAuth without including your Tavily API key in the URL. For example, in your `mcp.json`:

```json
{
  "mcpServers": {
    "tavily-remote-mcp": {
      "command": "npx mcp-remote https://mcp.tavily.com/mcp",
      "env": {}
    }
  }
}
```

If you need to clear stored OAuth credentials and reauthenticate, run:

```bash
rm -rf ~/.mcp-auth
```

> **Note:**
> - OAuth authentication is optional. You can still use API key authentication at any time by including your Tavily API key in the URL query parameter (`?tavilyApiKey=...`) or by setting it in the `Authorization` header, as described above.

#### Selecting Which API Key Is Used for OAuth

After successful OAuth authentication, you can control which API key is used by naming it `mcp_auth_default`:

- If you set a key named `mcp_auth_default` in your **personal account**, that key will be used for the auth flow.
- If you are part of a **team** that has a key named `mcp_auth_default`, that key will be used for the auth flow.
- If you have **both** a personal key and a team key named `mcp_auth_default`, the **personal key will be prioritized**.
- If no `mcp_auth_default` key is set, the `default` key in your personal account will be used. If no `default` key is set, the first available key will be used.

## Local MCP 

### Prerequisites 🔧

Before you begin, ensure you have:

- [Tavily API key](https://app.tavily.com/home)
  - If you don't have a Tavily API key, you can sign up for a free account [here](https://app.tavily.com/home)
- [Claude Desktop](https://claude.ai/download) or [Cursor](https://cursor.sh)
- [Node.js](https://nodejs.org/) (v20 or higher)
  - You can verify your Node.js installation by running:
    - `node --version`
- [Git](https://git-scm.com/downloads) installed (only needed if using Git installation method)
  - On macOS: `brew install git`
  - On Linux: 
    - Debian/Ubuntu: `sudo apt install git`
    - RedHat/CentOS: `sudo yum install git`
  - On Windows: Download [Git for Windows](https://git-scm.com/download/win)

### Running with NPX 

```bash
npx -y tavily-mcp@latest 
```

## Default Parameters Configuration ⚙️

You can set default parameter values for the `tavily-search` tool using the `DEFAULT_PARAMETERS` environment variable. This allows you to configure default search behavior without specifying these parameters in every request.

### Example Configuration

```bash
export DEFAULT_PARAMETERS='{"include_images": true}'
```

### Example usage from Client
```json
{
  "mcpServers": {
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": {
        "TAVILY_API_KEY": "your-api-key-here",
        "DEFAULT_PARAMETERS": "{\"include_images\": true, \"max_results\": 15, \"search_depth\": \"advanced\"}"
      }
    }
  }
}
```


## Tavily Extract Output

`tavily_extract` is intended for full-page extraction from known URLs. By default, formatted MCP responses print the clean extracted `Content:` field only; `raw_content` is not printed, which keeps model context focused and avoids dumping boilerplate or page garbage into responses.

`tavily_extract` always sends advanced text extraction to Tavily:

```json
{
  "extract_depth": "advanced",
  "format": "text"
}
```

The tool schema intentionally does not expose markdown output or basic extraction. Advanced text extraction remains appropriate when tables, specs, product details, and embedded content matter. Tavily MCP does not use chunking as the default extraction path for `tavily_extract`.

If you explicitly need raw content in formatted output for debugging or a specialized workflow, opt in with:

```bash
export TAVILY_INCLUDE_RAW_CONTENT=true
```

The default is `false`.

## Optional Pennyroyal Source-Packet Helper

The Pennyroyal helper is **disabled by default**. When enabled through XML configuration, it applies only to `tavily_extract` and can turn Tavily extraction output into a compact evidence/source packet. It does not create a service, queue, or shared package, and it does not receive main chat history.

Configuration is read from `config/pennyroyal-helper.xml` by default. For local runtime use, copy the tracked default XML to the ignored live file and edit only the live file:

```bash
cp config/pennyroyal-helper.default.xml config/pennyroyal-helper.xml
```

`config/pennyroyal-helper.xml` is intentionally gitignored so repo updates do not overwrite operator runtime settings. If the live XML is missing, Tavily falls back to the tracked `config/pennyroyal-helper.default.xml`; if both files are missing, it uses built-in safe defaults. Override the path entirely with:

```bash
export TAVILY_PENNYROYAL_HELPER_CONFIG=/path/to/pennyroyal-helper.xml
```

The default helper endpoint is `http://127.0.0.1:8001/v1/chat/completions`, and the default model is `pennyroyal`. The request is OpenAI-compatible, non-streaming, stateless, and uses `prompts/source_packet.md` as the source-packet system prompt. `sourcePacket` defaults to normal thinking behavior (`<enableThinking>true</enableThinking>`); only explicit `<enableThinking>false</enableThinking>` adds request-side `chat_template_kwargs: {"enable_thinking": false}`.

Source-packet behavior is fail-open: if the helper config is missing or invalid, the prompt file is missing, the helper times out, returns malformed output, rejects a field, or otherwise errors, `tavily_extract` returns the normal formatted Tavily extraction output with a visible warning. Search, crawl, map, and research tools are not changed by source-packet settings.

File-like URLs such as `.pdf`, `.csv`, `.xlsx`, `.docx`, `.pptx`, archives, and images are guarded before Tavily or the helper are called. `tavily_extract` returns local workstation instructions for those URLs instead of sending them to Tavily extract or Pennyroyal.

## Identifying the End User (Optional)

You can optionally identify the end user on whose behalf requests are being made by setting the `TAVILY_HUMAN_ID` environment variable. When set, Tavily MCP forwards it as the `X-Human-Id` header on every API call, enabling per-user analytics.

This is **entirely optional** — leave it unset and behavior is unchanged.

```json
{
  "mcpServers": {
    "tavily-mcp": {
      "command": "npx",
      "args": ["-y", "tavily-mcp@latest"],
      "env": {
        "TAVILY_API_KEY": "your-api-key-here",
        "TAVILY_HUMAN_ID": "your-user-id"
      }
    }
  }
}
```

**Privacy note:** Tavily hashes `human_id` server-side (SHA-256) before storage, so the raw value is never persisted. Even so, prefer opaque identifiers (e.g. an internal user ID) over raw PII like emails when possible.

## Acknowledgments ✨

- [Model Context Protocol](https://modelcontextprotocol.io) for the MCP specification
- [Anthropic](https://anthropic.com) for Claude Desktop
