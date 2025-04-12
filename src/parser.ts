// src/parser.ts
import type { Token } from "moo";
import { lexer } from "./tokenizer";
import type { ASTNode, WorkspaceNode } from "./ast";


// src/parser.ts

export function parse(tokens: Token[]): ASTNode[] {
  const nodes: ASTNode[] = [];
  let i = 0;

  function peek() { return tokens[i]; }
  function next() { return tokens[i++]; }
  function skipWhitespace() {
    while (peek()?.type === "ws" || peek()?.type === "newline") {
      next();
    }
  }
  function expect(type: string): Token {
    skipWhitespace();
    const token = next();
    if (!token || token.type !== type) {
      throw new Error(`Expected token of type "${type}", but got "${token?.type}" at line ${token?.line}`);
    }
    return token;
  }

  // 1) A helper to parse the entire workspace block
  function parseWorkspaceBlock(): WorkspaceNode {
    expect("ident"); // we already know it's "workspace"
    const name = expect("string").value.replace(/"/g, "");
    const description = expect("string").value.replace(/"/g, "");
    expect("lbrace");

    const body: ASTNode[] = [];
    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;

      // Look for known blocks/keywords inside the workspace
      if (t.type === "ident" && t.value === "model") {
        const modelNode = parseModelBlock();
        body.push(modelNode);
      } else if (t.type === "ident" && t.value === "views") {
        // parseViewsBlock() – you’d implement similarly
        const viewsNode = parseViewsBlock();
        body.push(viewsNode);
      } else {
        // skip unknown tokens for now
        next();
      }
    }

    expect("rbrace");

    return {
      type: "Workspace",
      name,
      description,
      body,
    };
  }

  // 2) A helper to parse `model { ... }`
  function parseModelBlock(): ASTNode {
    expect("ident"); // 'model'
    expect("lbrace");

    const body: ASTNode[] = [];

    while (true) {
      skipWhitespace();
      const token = peek();
      if (!token || token.type === "rbrace") break;

      if (token.type === "ident") {
        const name = token.value;
        next(); // consume the identifier (like `user`)

        skipWhitespace();

        const nextToken = peek();
        if (nextToken?.type === "equals") {
          // user = person "..." "..."
          next(); // consume '='
          skipWhitespace();
          const typeIdent = expect("ident").value;
          const label = expect("string").value.replace(/"/g, "");
          const description = expect("string").value.replace(/"/g, "");

          if (typeIdent === "person") {
            body.push({ type: "Person", name, label, description });
          } else if (typeIdent === "softwareSystem") {
            body.push({ type: "SoftwareSystem", name, label, description });
          } else {
            console.warn(`⚠️ Unknown model type: ${typeIdent}`);
          }
        } else if (nextToken?.type === "arrow") {
          // user -> softwareSystem "..."
          next(); // consume '->'
          const target = expect("ident").value;
          const description = expect("string").value.replace(/"/g, "");
          body.push({ type: "Relationship", source: name, target, description });
        } else {
          console.warn(`⚠️ Unexpected token after ident: ${nextToken?.type}`);
          next();
        }
      } else {
        next(); // skip unexpected tokens
      }
    }

    expect("rbrace");

    return {
      type: "Model",
      body,
    };
  }

  // 3) A helper to parse `views { ... }`
  function parseViewsBlock(): ASTNode {
    expect("ident"); // 'views'
    expect("lbrace");

    // We won't detail the entire parse logic – similar structure
    // parse possible 'systemContext softwareSystem { ... }', 'styles { ... }', etc.
    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;
      next(); // skip for now
    }

    expect("rbrace");
    return { type: "Views", body: [] }; // placeholder
  }

  // 4) Our main parse loop: parse top-level statements
  while (i < tokens.length) {
    skipWhitespace();
    const token = peek();
    if (!token) break;

    if (token.type === "ident" && token.value === "workspace") {
      //next(); // consume the 'workspace' ident
      const workspaceNode = parseWorkspaceBlock();
      nodes.push(workspaceNode);
    } else {
      // skip unknown top-level tokens
      next();
    }
  }

  return nodes;
}

