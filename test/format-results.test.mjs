import test from 'node:test';
import assert from 'node:assert/strict';

const modulePath = '../build/index.js';

function sampleResponse(overrides = {}) {
  return {
    query: 'example',
    results: [{
      title: 'Example',
      url: 'https://example.com',
      content: 'Clean extracted content',
      score: 0.9,
      raw_content: 'Raw boilerplate content that should not be included by default',
      ...overrides,
    }],
  };
}

test('formatted result with content prints normal Content', async () => {
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse());

  assert.match(formatted, /Content: Clean extracted content/);
  assert.doesNotMatch(formatted, /Content: undefined/);
});

test('formatted result with raw_content but no content prints raw content under Content', async () => {
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse({
    content: undefined,
    raw_content: 'Useful extracted page text from raw_content',
  }));

  assert.match(formatted, /Content: Useful extracted page text from raw_content/);
  assert.doesNotMatch(formatted, /Content: undefined/);
  assert.doesNotMatch(formatted, /Raw Content:/);
});

test('formatted result with neither content nor raw_content does not print Content undefined', async () => {
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse({
    content: undefined,
    raw_content: undefined,
  }));

  assert.doesNotMatch(formatted, /Content: undefined/);
  assert.doesNotMatch(formatted, /Content:/);
  assert.doesNotMatch(formatted, /Raw Content:/);
});

test('default output does not print a separate Raw Content block', async () => {
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse());

  assert.match(formatted, /Content: Clean extracted content/);
  assert.doesNotMatch(formatted, /Raw Content:/);
  assert.doesNotMatch(formatted, /Raw boilerplate content/);
});

test('formatted result prints Raw Content only when explicitly enabled and raw content is additional', async () => {
  process.env.TAVILY_INCLUDE_RAW_CONTENT = 'true';
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse());

  assert.match(formatted, /Content: Clean extracted content/);
  assert.match(formatted, /Raw Content: Raw boilerplate content/);
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
});

test('formatted result does not print duplicate Raw Content when explicitly enabled and content matches raw_content', async () => {
  process.env.TAVILY_INCLUDE_RAW_CONTENT = 'true';
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse({
    content: 'Same extracted content',
    raw_content: 'Same extracted content',
  }));

  assert.match(formatted, /Content: Same extracted content/);
  assert.doesNotMatch(formatted, /Raw Content:/);
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
});

test('formatted result does not print separate Raw Content when only raw_content exists', async () => {
  process.env.TAVILY_INCLUDE_RAW_CONTENT = 'true';
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse({
    content: undefined,
    raw_content: 'Only raw content exists',
  }));

  assert.match(formatted, /Content: Only raw content exists/);
  assert.doesNotMatch(formatted, /Raw Content:/);
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
});

test('tavily_extract always sends advanced text extraction with no caller format or depth', async () => {
  const { TavilyClient } = await import(modulePath);
  const client = new TavilyClient();
  let posted;
  client.axiosInstance = {
    post: async (_url, body) => {
      posted = body;
      return { data: { query: '', results: [] } };
    },
  };

  await client.extract({
    urls: ['https://example.com/specs'],
    include_images: false,
    include_favicon: false,
  });

  assert.equal(posted.extract_depth, 'advanced');
  assert.equal(posted.format, 'text');
  assert.equal(posted.include_images, false);
  assert.equal(posted.include_favicon, false);
  assert.ok(!('chunks_per_source' in posted));
});

test('tavily_extract ignores caller-supplied markdown format', async () => {
  const { TavilyClient } = await import(modulePath);
  const client = new TavilyClient();
  let posted;
  client.axiosInstance = {
    post: async (_url, body) => {
      posted = body;
      return { data: { query: '', results: [] } };
    },
  };

  await client.extract({
    urls: ['https://example.com/specs'],
    format: 'markdown',
  });

  assert.equal(posted.format, 'text');
  assert.equal(posted.extract_depth, 'advanced');
  assert.ok(!('chunks_per_source' in posted));
});

test('tavily_extract ignores caller-supplied basic extract depth', async () => {
  const { TavilyClient } = await import(modulePath);
  const client = new TavilyClient();
  let posted;
  client.axiosInstance = {
    post: async (_url, body) => {
      posted = body;
      return { data: { query: '', results: [] } };
    },
  };

  await client.extract({
    urls: ['https://example.com/specs'],
    extract_depth: 'basic',
  });

  assert.equal(posted.extract_depth, 'advanced');
  assert.equal(posted.format, 'text');
  assert.ok(!('chunks_per_source' in posted));
});

test('tavily_extract schema does not expose format, extract_depth, or chunking defaults', async () => {
  const { TAVILY_EXTRACT_INPUT_SCHEMA } = await import(modulePath);
  const properties = TAVILY_EXTRACT_INPUT_SCHEMA.properties;

  assert.ok(!('format' in properties));
  assert.ok(!('extract_depth' in properties));
  assert.ok(!('chunks_per_source' in properties));
  assert.ok(!('chunking' in properties));
});
