#!/usr/bin/env node
import http from 'node:http';
import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';

const DEFAULT_PORT = 4000;
const port = Number.parseInt(process.env.PORT ?? process.env.SHADCN_REGISTRY_PORT ?? `${DEFAULT_PORT}`, 10);

const cwd = process.cwd();
const registryDir = path.resolve(cwd, 'registry');

const REGISTRY_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry.json';

function safeJoin(baseDir, requestPath) {
  const normalized = path.normalize(requestPath).replace(/^\/+/, '');
  const joined = path.resolve(baseDir, normalized);
  if (!joined.startsWith(baseDir)) {
    return null;
  }
  return joined;
}

async function buildIndex() {
  const entries = await readdir(registryDir, { withFileTypes: true });
  const items = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    if (entry.name === 'registry.json') continue;
    const filePath = path.join(registryDir, entry.name);
    try {
      const raw = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items.push(...parsed);
      } else if (parsed) {
        items.push(parsed);
      }
    } catch (error) {
      console.warn(`Failed to read registry item from ${filePath}:`, error);
    }
  }
  items.sort((a, b) => {
    const nameA = typeof a?.name === 'string' ? a.name : '';
    const nameB = typeof b?.name === 'string' ? b.name : '';
    return nameA.localeCompare(nameB);
  });
  return {
    $schema: REGISTRY_SCHEMA_URL,
    name: '@cumulus',
    items,
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }
    const requestUrl = new URL(req.url, `http://localhost:${port}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    console.log(`${req.method} ${pathname}`);

    if (pathname === '/' || pathname === '') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        message: 'shadcn @cumulus registry server',
        registry: '@cumulus',
        files: 'GET /registry.json or /<component>.json',
      }));
      return;
    }

    if (pathname === '/registry.json') {
      const index = await buildIndex();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(index));
      return;
    }

    if (!pathname.endsWith('.json')) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const filePath = safeJoin(registryDir, pathname);
    if (!filePath) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    try {
      const contents = await readFile(filePath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.end(contents);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      throw error;
    }
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
  }
});

server.listen(port, () => {
  console.log(`Serving @cumulus registry from ${registryDir} on http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
