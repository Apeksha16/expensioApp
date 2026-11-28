const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

// Read .env file and load into process.env and bundle environment
const envFile = path.resolve(__dirname, '.env');
const envVars = {};

if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
      envVars[key] = val;
    }
  }
}

const config = getDefaultConfig(__dirname);

// Strip dev-only harness and mock adapter from non-dev (release) bundles (F-03)
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (!context.dev) {
    const normalized = moduleName.replace(/\\/g, '/');
    if (
      normalized.includes('friendsMockAdapter')
      || normalized.includes('/dev/AuditPreview')
      || normalized.includes('/dev/auditTarget')
    ) {
      return { type: 'empty' };
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Inject clean environment variables into the client runtime bundle
const originalSerializer = config.serializer.customSerializer;
config.serializer.customSerializer = async (entryPoint, preModules, graph, options) => {
  const preludeCode = `/* Env vars */(function(){if(typeof globalThis.process==='undefined'){globalThis.process={env:{}};}else if(!globalThis.process.env){globalThis.process.env={};}Object.assign(globalThis.process.env,${JSON.stringify(envVars)});})();`;
  const envPolyfillModule = {
    dependencies: new Map(),
    getSource: () => Buffer.from(preludeCode),
    inverseDependencies: new Set(),
    path: '\0polyfill:app-env',
    output: [
      {
        type: 'js/script',
        data: {
          code: preludeCode,
          lineCount: 1,
          map: [],
        },
      },
    ],
  };

  const modifiedPreModules = [envPolyfillModule, ...preModules];
  return originalSerializer(entryPoint, modifiedPreModules, graph, options);
};

module.exports = config;
