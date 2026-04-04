export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type PrimitiveSchemaType = "string" | "integer" | "number" | "boolean" | "object" | "array";

export interface SchemaField {
  id: string;
  fieldName: string;
  type: PrimitiveSchemaType;
  isArray?: boolean;
  sampleValue: string;
  comment?: string;
}

export interface EndpointAnnotations {
  preAuthorizeEnabled: boolean;
  preAuthorizeExpression: string;
  loggableEnabled: boolean;
  loggableAction: string;
  jsonViewEnabled: boolean;
  jsonViewClass: string;
}

export interface EndpointContract {
  id: string;
  endpointName: string;
  method: HttpMethod;
  path: string;
  annotations: EndpointAnnotations;
  requestFields: SchemaField[];
  responseFields: SchemaField[];
  requestSavedAt?: number;
  responseSavedAt?: number;
}

export interface ProjectSetup {
  projectName: string;
  moduleName: string;
  apiVersion: string;
  basePackage: string;
  baseRequestPath: string;
  controllerName: string;
  serviceName: string;
}
