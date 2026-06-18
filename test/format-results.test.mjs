import test from 'node:test';
import assert from 'node:assert/strict';

const modulePath = '../build/index.js';

function sampleResponse() {
  return {
    query: 'example',
    results: [{
      title: 'Example',
      url: 'https://example.com',
      content: 'Clean extracted content',
      score: 0.9,
      raw_content: 'Raw boilerplate content that should not be included by default',
    }],
  };
}

test('formatted result prints Content without Raw Content by default', async () => {
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse());

  assert.match(formatted, /Content: Clean extracted content/);
  assert.doesNotMatch(formatted, /Raw Content:/);
  assert.doesNotMatch(formatted, /Raw boilerplate content/);
});

test('formatted result prints Raw Content only when explicitly enabled', async () => {
  process.env.TAVILY_INCLUDE_RAW_CONTENT = 'true';
  const { formatResults } = await import(modulePath);

  const formatted = formatResults(sampleResponse());

  assert.match(formatted, /Content: Clean extracted content/);
  assert.match(formatted, /Raw Content: Raw boilerplate content/);
  delete process.env.TAVILY_INCLUDE_RAW_CONTENT;
});

test('advanced extract option remains forwarded', async () => {
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
    extract_depth: 'advanced',
    format: 'text',
    include_images: false,
    include_favicon: false,
  });

  assert.equal(posted.extract_depth, 'advanced');
  assert.equal(posted.format, 'text');
  assert.equal(posted.include_images, false);
  assert.equal(posted.include_favicon, false);
  assert.ok(!('chunks_per_source' in posted));
});
