#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { tokenize } from "./tokenizer.js";
import { parse } from "./parser.js"

console.log("✅ Structurizr linter is working!");

if (process.argv.length > 2) {
  const filePath = process.argv[2];
  console.log(`📄 Received file: ${filePath}`);

  const fullPath = path.resolve(filePath);
  try {
    const content = fs.readFileSync(fullPath, "utf-8");
    const tokens = tokenize(content);
    const ast = parse(tokens)

    /*for (const token of tokens) {
      console.log(
        `${token.type?.padEnd(10)} → '${token.value}' (line ${token.line}, col ${token.col})`
      );
    }*/
    console.log(JSON.stringify(ast, null, 2))
  } catch (err) {
    console.error(`❌ Failed to read file: ${err}`);
    process.exit(1);
  }
} else {
  console.log("⚠️  Usage: structurizr-lint path/to/file.dsl");
}


