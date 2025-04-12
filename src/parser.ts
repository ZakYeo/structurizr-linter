// src/parser.ts
import type { Token } from "moo";
import type {
  ASTNode,
  WorkspaceNode,
  StyleElementNode,
  StyleProperty,
  IncludeStatement,
  AutoLayoutStatement,
} from "./ast";

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

  /**
   * Expect an ident token (with optional specific value).
   * e.g. expectIdent() or expectIdent("styles").
   * Throws if not found.
   */
  function expectIdent(expectedValue?: string): Token {
    skipWhitespace();
    const token = next();
    if (!token || token.type !== "ident") {
      throw new Error(
        `Expected token of type "ident" (value=${expectedValue || "any"}), got ${
          token?.type
        } at line ${token?.line}`
      );
    }
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(
        `Expected ident "${expectedValue}", but got "${token.value}" at line ${token.line}`
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
    expectIdent("workspace"); // e.g. 'workspace'
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
    expectIdent("model");
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
   * Parse `element "Person" { background #08427b ... }`
   */
  function parseStyleElement(): StyleElementNode {
    expectIdent("element");
    const selector = expect("string").value.replace(/"/g, "");
    expect("lbrace");

    const properties: StyleProperty[] = [];

    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;

      // e.g. background #08427b
      if (t.type === "ident") {
        const propName = t.value; // e.g. "background"
        next(); // consume propName
        skipWhitespace();

        const valueToken = peek();
        if (!valueToken) break;

        // might be ident, hex, string, etc. For your DSL we expect hex
        if (
          valueToken.type === "hex" ||
          valueToken.type === "ident" ||
          valueToken.type === "string"
        ) {
          // store raw .value, e.g. "#08427b"
          properties.push({ name: propName, value: valueToken.value });
          next(); // consume
        } else {
          // skip unknown
          next();
        }
      } else {
        next(); // skip unknown line
      }
    }

    expect("rbrace");

    return {
      type: "StyleElement",
      selector,
      properties,
    };
  }

  /**
   * Parse a `styles { ... }` block.
   */
  function parseStylesBlock(): ASTNode {
    expectIdent("styles");
    expect("lbrace");

    const elements: StyleElementNode[] = [];

    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;

      if (t.type === "ident" && t.value === "element") {
        elements.push(parseStyleElement());
      } else {
        next(); // skip unknown lines
      }
    }

    expect("rbrace");

    return {
      type: "Styles",
      elements,
    };
  }

  /**
   * Parse `systemContext softwareSystem { ... }`
   */
  function parseSystemContextBlock(): ASTNode {
    expectIdent("systemContext");
    skipWhitespace();
    const systemNameToken = expect("ident"); // e.g. "softwareSystem"
    expect("lbrace");

    const statements: Array<IncludeStatement | AutoLayoutStatement> = [];

    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;

      if (t.type === "ident" && t.value === "include") {
        next(); // consume 'include'
        skipWhitespace();
        const starOrIdent = peek();
        if (!starOrIdent) break;

        // For example: `include *`
        const what = starOrIdent.value;
        next(); // consume it
        statements.push({ type: "IncludeStatement", what });
      } else if (t.type === "ident" && t.value === "autolayout") {
        next(); // consume 'autolayout'
        skipWhitespace();
        const directionToken = peek();
        if (!directionToken) break;

        const direction = directionToken.value; // e.g. 'lr'
        next(); // consume
        statements.push({ type: "AutoLayoutStatement", direction });
      } else {
        // skip unknown lines
        next();
      }
    }

    expect("rbrace");

    return {
      type: "SystemContext",
      system: systemNameToken.value,
      statements,
    };
  }

  /**
   * Parse a `views { ... }` block, containing `systemContext` and `styles` sub-blocks.
   */
  function parseViewsBlock(): ASTNode {
    expectIdent("views");
    expect("lbrace");

    const body: ASTNode[] = [];
    while (true) {
      skipWhitespace();
      const t = peek();
      if (!t || t.type === "rbrace") break;

      if (t.type === "ident" && t.value === "systemContext") {
        body.push(parseSystemContextBlock());
      } else if (t.type === "ident" && t.value === "styles") {
        body.push(parseStylesBlock());
      } else {
        // skip unknown lines in views
        next();
      }
    }

    expect("rbrace");
    return {
      type: "Views",
      body,
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
      // parseWorkspaceBlock expects to see 'workspace'
      const workspaceNode = parseWorkspaceBlock();
      nodes.push(workspaceNode);
    } else {
      // Skip unknown top-level tokens
      next();
    }
  }

  return nodes;
}

