// src/parser.ts
import type { Token } from "moo";
import type { ASTNode, WorkspaceNode } from "./ast";

/**
 * Parse a list of tokens into an AST array.
 * Top-level: find `workspace` blocks or skip unknown tokens.
 */
export function parse(tokens: Token[]): ASTNode[] {
  const nodes: ASTNode[] = [];
  let i = 0;

  // ------------------------------------------------------
  // Basic token utilities
  // ------------------------------------------------------

  function peek(): Token | undefined {
    return tokens[i];
  }

  function next(): Token | undefined {
    return tokens[i++];
  }

  function skipWhitespace(): void {
    while (peek()?.type === "ws" || peek()?.type === "newline") {
      next();
    }
  }

  /**
   * Expect a token of a specific type.
   * Throws if the next token doesn't match.
   */
  function expect(type: string): Token {
    skipWhitespace();
    const token = next();
    if (!token || token.type !== type) {
      throw new Error(
        `Expected token of type "${type}", but got "${token?.type}" at line ${token?.line}`
      );
    }
    return token;
  }

  // ------------------------------------------------------
  // Parse functions for known blocks
  // ------------------------------------------------------

  /**
   * Parse a `workspace "Name" "Description" { ... }` block.
   * Returns a WorkspaceNode with nested AST.
   */
  function parseWorkspaceBlock(): WorkspaceNode {
    // We already know we've seen "workspace" from the caller, so:
    expect("ident"); // e.g. 'workspace'
    const name = expect("string").value.replace(/"/g, "");
    const description = expect("string").value.replace(/"/g, "");
    expect("lbrace");

    const body: ASTNode[] = [];
    while (true) {
      skipWhitespace();
      const t = peek();
      // Stop if end of tokens or we see a '}'
      if (!t || t.type === "rbrace") break;

      // Known sub-blocks:
      if (t.type === "ident" && t.value === "model") {
        const modelNode = parseModelBlock();
        body.push(modelNode);
      } else if (t.type === "ident" && t.value === "views") {
        const viewsNode = parseViewsBlock();
        body.push(viewsNode);
      } else {
        // Skip anything else
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

  /**
   * Parse a `model { ... }` block.
   * Returns a Model node with its statements (Person, SoftwareSystem, Relationship).
   */
  function parseModelBlock(): ASTNode {
    expect("ident"); // should be 'model'
    expect("lbrace");

    const body: ASTNode[] = [];
    while (true) {
      skipWhitespace();
      const token = peek();

      // Stop if end of tokens or a '}'
      if (!token || token.type === "rbrace") break;

      // If we see an identifier, it might be
      // "user = person..." or "user -> softwareSystem..."
      if (token.type === "ident") {
        const name = token.value;
        next(); // consume the identifier

        skipWhitespace();

        const nextToken = peek();
        if (nextToken?.type === "equals") {
          // e.g. "user = person "User" "Desc""
          next(); // consume '='
          skipWhitespace();

          const typeIdent = expect("ident").value;
          const label = expect("string").value.replace(/"/g, "");
          const description = expect("string").value.replace(/"/g, "");

          if (typeIdent === "person") {
            body.push({
              type: "Person",
              name,
              label,
              description,
            });
          } else if (typeIdent === "softwareSystem") {
            body.push({
              type: "SoftwareSystem",
              name,
              label,
              description,
            });
          } else {
            console.warn(`⚠️ Unknown model type: ${typeIdent}`);
          }
        } else if (nextToken?.type === "arrow") {
          // e.g. "user -> softwareSystem "Uses""
          next(); // consume '->'
          const target = expect("ident").value;
          const relationshipDescription = expect("string").value.replace(/"/g, "");

          body.push({
            type: "Relationship",
            source: name,
            target,
            description: relationshipDescription,
          });
        } else {
          console.warn(`⚠️ Unexpected token after ident: ${nextToken?.type}`);
          next();
        }
      } else {
        // Skip anything else in the model block
        next();
      }
    }

    expect("rbrace");

    return {
      type: "Model",
      body,
    };
  }

  /**
   * Parse a `views { ... }` block.
   * Currently just skipping everything inside.
   */
  function parseViewsBlock(): ASTNode {
    expect("ident"); // should be 'views'
    expect("lbrace");

    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;
      next(); // skip for now
    }

    expect("rbrace");
    return {
      type: "Views",
      body: [],
    };
  }

  // ------------------------------------------------------
  // Main parse loop
  // ------------------------------------------------------

  while (i < tokens.length) {
    skipWhitespace();
    const token = peek();
    if (!token) break;

    if (token.type === "ident" && token.value === "workspace") {
      // We haven't consumed 'workspace' ident yet,
      // because parseWorkspaceBlock expects to see it:
      const workspaceNode = parseWorkspaceBlock();
      nodes.push(workspaceNode);
    } else {
      // Skip unknown top-level tokens
      next();
    }
  }

  return nodes;
}

