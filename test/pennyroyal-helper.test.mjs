import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';

const modulePath = '../build/index.js';

function tempDir() {
  return mkdtempSync(path.join(tmpdir(), 'tavily-pennyroyal-'));
}

function configXml({ enabled = 'true', sourceEnabled = 'true', enableThinking = 'true', endpoint = 'http://127.0.0.1:1/v1/chat/completions', maxConcurrent = 2, promptFile = 'prompts/source_packet.md' } = {}) {
  return `<pennyroyalHelper enabled="${enabled}">
    <endpoint>${endpoint}</endpoint>
    <model>pennyroyal</model>
    <maxConcurrent>${maxConcurrent}</maxConcurrent>
    <failOpen>true</failOpen>
    <toolDescriptions>
      <tool name="tavily_search">XML search description</tool>
      <tool name="tavily_extract">XML extract description</tool>
    </toolDescriptions>
    <sourcePacket enabled="${sourceEnabled}">
      <enableThinking>${enableThinking}</enableThinking>
      <timeoutSeconds>2</timeoutSeconds>
      <maxInputTokens>100</maxInputTokens>
      <maxOutputTokens>64</maxOutputTokens>
      <promptFile>${promptFile}</promptFile>
    </sourcePacket>
  </pennyroyalHelper>`;
}

test('missing config means helper disabled and default descriptions exist', async () => {
  const { loadPennyroyalConfig } = await import(modulePath);
  const cfg = loadPennyroyalConfig('/tmp/definitely-missing-pennyroyal.xml');
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.sourcePacket.enabled, false);
  assert.deepEqual(cfg.toolDescriptions, {});
});

test('invalid config disables helper and fails open', async () => {
  const { loadPennyroyalConfig } = await import(modulePath);
  const dir = tempDir();
  const file = path.join(dir, 'bad.xml');
  writeFileSync(file, '<notHelper>');
  const cfg = loadPennyroyalConfig(file);
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.sourcePacket.enabled, false);
  rmSync(dir, { recursive: true, force: true });
});

test('tool description XML overrides work while defaults remain available', async () => {
  const { loadPennyroyalConfig } = await import(modulePath);
  const dir = tempDir();
  const file = path.join(dir, 'helper.xml');
  writeFileSync(file, configXml({ enabled: 'false', sourceEnabled: 'false' }));
  const cfg = loadPennyroyalConfig(file);
  assert.equal(cfg.toolDescriptions.tavily_search, 'XML search description');
  assert.equal(cfg.toolDescriptions.tavily_extract, 'XML extract description');
  rmSync(dir, { recursive: true, force: true });
});

test('file-like URL guard returns local workstation instructions', async () => {
  const { TavilyClient } = await import(modulePath);
  const client = new TavilyClient();
  let called = false;
  client.axiosInstance = { post: async () => { called = true; throw new Error('should not call Tavily'); } };
  const text = await client.handleExtractTool({ urls: ['https://example.com/file.pdf'] });
  assert.match(text, /FILE-LIKE URL DETECTED/);
  assert.match(text, /Use your local workstation/);
  assert.equal(called, false);
});

test('tavily_extract uses source_packet when enabled', async () => {
  const { TavilyClient, loadPennyroyalConfig, PennyroyalHelperClient } = await import(modulePath);
  const dir = tempDir();
  mkdirSync(path.join(dir, 'prompts'));
  writeFileSync(path.join(dir, 'prompts/source_packet.md'), 'prompt');
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const parsed = JSON.parse(body);
      assert.equal(parsed.chat_template_kwargs, undefined);
      res.end(JSON.stringify({ choices: [{ message: { content: 'SOURCE PACKET\npacket' } }] }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const cfgFile = path.join(dir, 'helper.xml');
  writeFileSync(cfgFile, configXml({ endpoint: `http://127.0.0.1:${port}/v1/chat/completions` }));
  const client = new TavilyClient();
  client.pennyroyalConfig = loadPennyroyalConfig(cfgFile);
  client.pennyroyalHelper = new PennyroyalHelperClient(client.pennyroyalConfig, dir);
  client.axiosInstance = { post: async () => ({ data: { query: 'q', results: [{ title: 'T', url: 'https://example.com', content: 'content', score: 1 }] } }) };
  const text = await client.handleExtractTool({ urls: ['https://example.com'], query: 'q' });
  assert.equal(text, 'SOURCE PACKET\npacket');
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

test('source packet helper failure returns formatted extract output with warning', async () => {
  const { TavilyClient, loadPennyroyalConfig, PennyroyalHelperClient } = await import(modulePath);
  const dir = tempDir();
  const cfgFile = path.join(dir, 'helper.xml');
  writeFileSync(cfgFile, configXml({ promptFile: 'missing.md' }));
  const client = new TavilyClient();
  client.pennyroyalConfig = loadPennyroyalConfig(cfgFile);
  client.pennyroyalHelper = new PennyroyalHelperClient(client.pennyroyalConfig, dir);
  client.axiosInstance = { post: async () => ({ data: { query: 'q', results: [{ title: 'T', url: 'https://example.com', content: 'content', score: 1 }] } }) };
  const text = await client.handleExtractTool({ urls: ['https://example.com'] });
  assert.match(text, /Content: content/);
  assert.match(text, /pennyroyal source_packet failed open: missing prompt file/);
  rmSync(dir, { recursive: true, force: true });
});

test('explicit enableThinking false adds request-side no-thinking', async () => {
  const { loadPennyroyalConfig, PennyroyalHelperClient } = await import(modulePath);
  const dir = tempDir();
  mkdirSync(path.join(dir, 'prompts'));
  writeFileSync(path.join(dir, 'prompts/source_packet.md'), 'prompt');
  let body;
  const server = http.createServer((req, res) => {
    req.on('data', c => body = (body || '') + c);
    req.on('end', () => res.end(JSON.stringify({ choices: [{ message: { content: 'packet' } }] })));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const cfgFile = path.join(dir, 'helper.xml');
  writeFileSync(cfgFile, configXml({ endpoint: `http://127.0.0.1:${server.address().port}/v1/chat/completions`, enableThinking: 'false' }));
  const helper = new PennyroyalHelperClient(loadPennyroyalConfig(cfgFile), dir);
  await helper.sourcePacket({ sources: [] });
  assert.equal(JSON.parse(body).chat_template_kwargs.enable_thinking, false);
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

test('semaphore maxConcurrent is applied', async () => {
  const { loadPennyroyalConfig, PennyroyalHelperClient } = await import(modulePath);
  const dir = tempDir();
  mkdirSync(path.join(dir, 'prompts'));
  writeFileSync(path.join(dir, 'prompts/source_packet.md'), 'prompt');
  let active = 0, maxActive = 0;
  const server = http.createServer((req, res) => {
    active++; maxActive = Math.max(maxActive, active);
    req.resume();
    setTimeout(() => { active--; res.end(JSON.stringify({ choices: [{ message: { content: 'packet' } }] })); }, 80);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const cfgFile = path.join(dir, 'helper.xml');
  writeFileSync(cfgFile, configXml({ endpoint: `http://127.0.0.1:${server.address().port}/v1/chat/completions`, maxConcurrent: 1 }));
  const helper = new PennyroyalHelperClient(loadPennyroyalConfig(cfgFile), dir);
  await Promise.all([helper.sourcePacket({ a: 1 }), helper.sourcePacket({ a: 2 })]);
  assert.equal(maxActive, 1);
  server.close();
  rmSync(dir, { recursive: true, force: true });
});

test('source_packet does not alter search, crawl, map, or research method requests', async () => {
  const { TavilyClient, loadPennyroyalConfig, PennyroyalHelperClient } = await import(modulePath);
  const dir = tempDir();
  const cfgFile = path.join(dir, 'helper.xml');
  writeFileSync(cfgFile, configXml());
  const client = new TavilyClient();
  client.pennyroyalConfig = loadPennyroyalConfig(cfgFile);
  client.pennyroyalHelper = new PennyroyalHelperClient(client.pennyroyalConfig, dir);
  const calls = [];
  client.axiosInstance = {
    post: async (url, body) => {
      calls.push({ url, body });
      if (String(url).endsWith('/research')) return { data: { request_id: 'r1' } };
      return { data: { query: body.query || '', results: [], base_url: body.url || '' } };
    },
    get: async () => ({ data: { status: 'completed', content: 'research content' } }),
  };

  await client.search({ query: 'q', include_domains: [], exclude_domains: [] });
  await client.crawl({ url: 'https://example.com', select_paths: [], select_domains: [] });
  await client.map({ url: 'https://example.com', select_paths: [], select_domains: [] });
  await client.research({ input: 'topic', model: 'mini' });

  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.ok(!('messages' in call.body));
    assert.ok(!('chat_template_kwargs' in call.body));
    assert.ok(!('max_tokens' in call.body));
  }
  rmSync(dir, { recursive: true, force: true });
});
