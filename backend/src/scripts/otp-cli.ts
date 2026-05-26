#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

const STORE_FILE = path.resolve(__dirname, '../../.otp_cli_store.json');

type Entry = { code: string; expiresAt: number };
type Store = Record<string, Entry>;

async function loadStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    return JSON.parse(raw) as Store;
  } catch (err) {
    return {};
  }
}

async function saveStore(store: Store) {
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function genCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function cmdGen(contact: string) {
  const store = await loadStore();
  const code = genCode();
  store[contact] = { code, expiresAt: Date.now() + 10 * 60 * 1000 };
  await saveStore(store);
  console.log(`OTP for ${contact}: ${code}`);
}

async function cmdVerify(contact: string, code: string) {
  const store = await loadStore();
  const entry = store[contact];
  if (!entry) {
    console.error('No OTP found for this contact');
    process.exit(2);
  }
  if (Date.now() > entry.expiresAt) {
    delete store[contact];
    await saveStore(store);
    console.error('OTP expired');
    process.exit(3);
  }
  if (entry.code !== code) {
    console.error('Invalid OTP');
    process.exit(4);
  }

  // success
  delete store[contact];
  await saveStore(store);
  console.log('OTP verified');
}

async function cmdClear() {
  await saveStore({});
  console.log('Store cleared');
}

async function main() {
  const [, , command, contact, code] = process.argv;
  if (!command) {
    console.log('Usage: npx tsx src/scripts/otp-cli.ts gen|verify|clear <contact> [code]');
    process.exit(1);
  }

  if (command === 'gen') {
    if (!contact) {
      console.error('contact (email or phone) required');
      process.exit(1);
    }
    await cmdGen(contact);
    process.exit(0);
  }

  if (command === 'verify') {
    if (!contact || !code) {
      console.error('contact and code required');
      process.exit(1);
    }
    await cmdVerify(contact, code);
    process.exit(0);
  }

  if (command === 'clear') {
    await cmdClear();
    process.exit(0);
  }

  console.error('Unknown command');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
