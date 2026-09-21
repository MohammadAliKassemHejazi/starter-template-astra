#!/usr/bin/env node

import process from 'node:process';

const input = await readInput();
const toolName = typeof input.tool_name === 'string' ? input.tool_name : '';
const toolInput = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};

const blockReason = getBlockReason(toolName, toolInput);
if (blockReason) {
  process.stderr.write(`Blocked by AstraSyntx safety hook: ${blockReason}\n`);
  process.exit(2);
}

process.exit(0);

async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    // Fail open when Claude Code does not provide valid event JSON. Normal tool
    // permissions still apply; the hook must not block development on bad input.
    return {};
  }
}

function getBlockReason(toolName, toolInput) {
  if (toolName === 'Bash') {
    return blockDangerousCommand(String(toolInput.command ?? ''));
  }

  if (toolName === 'Write' || toolName === 'Edit') {
    return blockSensitivePath(String(toolInput.file_path ?? toolInput.path ?? ''));
  }

  // MCP tool calls (mcp__server__toolName) have heterogeneous, per-server
  // input shapes — there's no single "command" or "file_path" field to check
  // the way Bash/Write/Edit have. Best-effort generic scan: walk every string
  // value in tool_input and apply the SAME destructive-command and
  // sensitive-path checks used above. This won't catch everything an MCP
  // server could do (that's an inherent limit of a generic scan across
  // arbitrary schemas), but it closes the gap of MCP calls being entirely
  // unchecked, which they were before this branch existed.
  if (toolName.startsWith('mcp__')) {
    for (const value of collectStrings(toolInput)) {
      const cmdReason = blockDangerousCommand(value);
      if (cmdReason) return `${cmdReason} (via MCP tool ${toolName})`;
      const pathReason = blockSensitivePath(value);
      if (pathReason) return `${pathReason} (via MCP tool ${toolName})`;
    }
  }

  return null;
}

function collectStrings(value, depth = 0) {
  if (depth > 4) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(v => collectStrings(v, depth + 1));
  if (value && typeof value === 'object') return Object.values(value).flatMap(v => collectStrings(v, depth + 1));
  return [];
}

function blockDangerousCommand(command) {
  const normalized = command.replace(/\s+/g, ' ').trim();

  // Recursive+forced rm targeting a protected root. Ordinary project paths and
  // scratch dirs like ./build, dist, node_modules, or /tmp/x are NOT matched.
  const rmFlags = String.raw`(?:-[a-zA-Z]*[rf][a-zA-Z]*\s+|--recursive\s+|--force\s+|--no-preserve-root\s+)+`;
  // (a) bare filesystem root or home: / or ~ or $HOME, terminated (not a longer path)
  const bareRoot = String.raw`(?:\/|~|\$HOME)\s*(?:$|;|&|\|)`;
  // (b) a protected system directory, with or without a trailing subpath
  const systemDir = String.raw`\/(?:home|etc|usr|var|bin|boot|lib|lib64|opt|root|sbin|sys|proc|dev)(?:\/\S*)?\s*(?:$|;|&|\|)`;
  const destructiveRootRemoval = new RegExp(String.raw`\brm\s+${rmFlags}(?:${bareRoot}|${systemDir})`);
  if (destructiveRootRemoval.test(normalized + ' ')) {
    return 'recursive forced removal of a protected filesystem root is prohibited.';
  }

  const isGitPush = /\bgit\s+push\b/.test(normalized);
  const usesForce = /(?:\s--force(?:-with-lease)?\b|\s-f\b)/.test(normalized);
  const targetsProtectedBranch = /\b(?:main|master|develop|production)\b/.test(normalized);
  if (isGitPush && usesForce && targetsProtectedBranch) {
    return 'force-pushing to a protected branch requires an explicit Founder decision outside the hook.';
  }

  if (/\bdrop\s+database\b/i.test(normalized)) {
    return 'DROP DATABASE is destructive and requires the package’s data-change approval process.';
  }

  return null;
}

function blockSensitivePath(filePath) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const baseName = normalized.split('/').pop() ?? '';

  if (baseName === '.env' || (/^\.env\./.test(baseName) && !['.env.example', '.env.template'].includes(baseName))) {
    return 'writing a real environment file is prohibited; update .env.example or use the approved secret manager.';
  }

  const sensitiveNames = new Set([
    'id_rsa',
    'id_ed25519',
    'credentials',
    'credentials.json',
    'service-account.json',
  ]);

  if (sensitiveNames.has(baseName) || /\.(pem|key|p12|pfx)$/i.test(baseName)) {
    return 'writing a private key or credential file is prohibited.';
  }

  return null;
}
