#!/usr/bin/env node

console.log("✅ Structurizr linter is working!");

if (process.argv.length > 2) {
  const filePath = process.argv[2];
  console.log(`Received file: ${filePath}`);
} else {
  console.log("Usage: structurizr-lint path/to/file.dsl");
}

