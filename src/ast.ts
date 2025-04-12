export type ASTNode =
  | WorkspaceNode
  | ModelNode
  | PersonNode
  | SoftwareSystemNode
  | RelationshipNode
  | ViewsNode
  | UnknownNode;

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

