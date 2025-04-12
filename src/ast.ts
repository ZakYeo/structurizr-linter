// src/ast.ts

export type ASTNode =
  | WorkspaceNode
  | ModelNode
  | PersonNode
  | SoftwareSystemNode
  | RelationshipNode
  | ViewsNode
  | UnknownNode
  | SystemContextNode
  | IncludeStatement
  | AutoLayoutStatement
  | StyleElementNode
  | StyleProperty
  | StylesNode;

export interface WorkspaceNode {
  type: "Workspace";
  name: string;
  description: string;
  body: ASTNode[];
}

export interface ModelNode {
  type: "Model";
  body: ASTNode[];
}

export interface PersonNode {
  type: "Person";
  name: string;
  label: string;
  description: string;
}

export interface SoftwareSystemNode {
  type: "SoftwareSystem";
  name: string;
  label: string;
  description: string;
}

export interface RelationshipNode {
  type: "Relationship";
  source: string;
  target: string;
  description: string;
}

export interface ViewsNode {
  type: "Views";
  body: ASTNode[];
}

export interface UnknownNode {
  type: "Unknown";
  token: any;
}

export interface SystemContextNode {
  type: "SystemContext";
  system: string; // e.g., "softwareSystem" from `systemContext softwareSystem`
  statements: Array<IncludeStatement | AutoLayoutStatement>;
}

export interface IncludeStatement {
  type: "IncludeStatement";
  what: string; // e.g. "*" from `include *`
}

export interface AutoLayoutStatement {
  type: "AutoLayoutStatement";
  direction: string; // e.g. "lr"
}

export interface StyleElementNode {
  type: "StyleElement";
  selector: string; // e.g., "Person" or "Software System"
  properties: StyleProperty[];
}

export interface StyleProperty {
  name: string; // e.g., "background"
  value: string; // e.g., "#08427b"
}

export interface StylesNode {
  type: "Styles";
  elements: StyleElementNode[];
}

