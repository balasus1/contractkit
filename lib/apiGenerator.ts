import YAML from "yaml";

import { PrimitiveSchemaType, SchemaField } from "@/lib/types";

export interface GeneratorOperation {
  id: string;
  originalTag: string;
  tag: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  summary: string;
  description?: string;
  contentType: string;
  requestFields: SchemaField[];
  responseSchema: unknown;
  collapsed?: boolean;
}

interface OpenApiDocument {
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  paths?: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

const SUPPORTED_CONTENT_TYPES = [
  "application/json",
  "multipart/form-data",
  "application/x-www-form-urlencoded"
] as const;

const createField = (): SchemaField => ({
  id: crypto.randomUUID(),
  fieldName: "",
  type: "string",
  sampleValue: "",
  comment: ""
});

const normalizeType = (type?: string): PrimitiveSchemaType => {
  if (type === "integer" || type === "number" || type === "boolean" || type === "object" || type === "array") {
    return type;
  }

  return "string";
};

const parseFieldFromProperty = (name: string, schema: any): SchemaField => {
  return {
    id: crypto.randomUUID(),
    fieldName: name,
    type: schema?.type === "array" ? "array" : normalizeType(schema?.type),
    sampleValue:
      schema?.example !== undefined
        ? typeof schema.example === "object"
          ? JSON.stringify(schema.example)
          : String(schema.example)
        : schema?.type === "array"
          ? "[]"
          : "",
    comment: schema?.description || ""
  };
};

export const parseOpenApiFromText = (raw: string): OpenApiDocument => {
  try {
    return JSON.parse(raw) as OpenApiDocument;
  } catch {
    return YAML.parse(raw) as OpenApiDocument;
  }
};

export const resolveSchema = (
  schema: any,
  components?: Record<string, any>,
  depth = 0,
  visited = new Set<string>()
): any => {
  if (!schema || depth > 12) {
    return schema;
  }

  if (schema.$ref && components) {
    const refKey = String(schema.$ref).replace("#/components/schemas/", "");
    if (visited.has(refKey)) {
      return { type: "object" };
    }
    visited.add(refKey);
    const resolved = resolveSchema(components[refKey], components, depth + 1, visited);
    visited.delete(refKey);
    return resolved;
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    const merged = schema.allOf.reduce(
      (acc: any, part: any) => {
        const resolved = resolveSchema(part, components, depth + 1, visited) || {};
        return {
          ...acc,
          ...resolved,
          properties: {
            ...(acc.properties || {}),
            ...(resolved.properties || {})
          }
        };
      },
      { type: "object", properties: {} }
    );
    return merged;
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    return resolveSchema(schema.oneOf[0], components, depth + 1, visited);
  }

  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    return resolveSchema(schema.anyOf[0], components, depth + 1, visited);
  }

  if (schema.type === "array") {
    return {
      ...schema,
      items: resolveSchema(schema.items, components, depth + 1, visited)
    };
  }

  if (schema.type === "object" && schema.properties) {
    const resolvedProps: Record<string, any> = {};
    Object.entries(schema.properties).forEach(([key, value]) => {
      resolvedProps[key] = resolveSchema(value, components, depth + 1, visited);
    });
    return {
      ...schema,
      properties: resolvedProps
    };
  }

  return schema;
};

const schemaToFields = (schema: any): SchemaField[] => {
  if (!schema || schema.type !== "object" || !schema.properties) {
    return [createField()];
  }

  const fields = Object.entries(schema.properties).map(([name, value]) => parseFieldFromProperty(name, value));
  return fields.length ? fields : [createField()];
};

export const extractOperationsByTag = (doc: OpenApiDocument): GeneratorOperation[] => {
  const components = doc.components?.schemas || {};
  const paths = doc.paths || {};
  const operations: GeneratorOperation[] = [];

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods || {}).forEach(([methodKey, operation]) => {
      const upperMethod = methodKey.toUpperCase();
      if (!["GET", "POST", "PUT", "DELETE", "PATCH"].includes(upperMethod)) {
        return;
      }

      const tags = Array.isArray(operation?.tags) && operation.tags.length ? operation.tags : ["Default Controller"];
      const content = operation?.requestBody?.content || {};
      const contentType =
        SUPPORTED_CONTENT_TYPES.find((item) => content[item]) || Object.keys(content)[0] || "application/json";
      
      // Try to find examples in requestBody
      let requestSchema = resolveSchema(content?.[contentType]?.schema, components);
      const requestExample = content?.[contentType]?.examples 
        ? Object.values(content?.[contentType]?.examples)[0] as any
        : content?.[contentType]?.example;

      const responses = operation?.responses || {};
      const firstResponseCode = Object.keys(responses).find(code => code.startsWith("2")) || "200";
      const firstResponse = responses[firstResponseCode] || responses.default || Object.values(responses)[0] || {};
      const firstResponseContent = firstResponse?.content || {};
      const responseContentType =
        SUPPORTED_CONTENT_TYPES.find((item) => firstResponseContent[item]) ||
        Object.keys(firstResponseContent)[0] ||
        "application/json";
      
      const responseSchema = resolveSchema(firstResponseContent?.[responseContentType]?.schema, components) || {
        type: "object"
      };

      const tryParse = (val: any) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      };

      const operationDescription = operation?.description || "";
      const operationSummary = operation?.summary || operation?.operationId || `${upperMethod} ${path}`;

      // Try to find examples in response
      const resExamples = firstResponseContent?.[responseContentType]?.examples;
      const resExample = firstResponseContent?.[responseContentType]?.example;
      const firstResponseContentExample = resExamples ? Object.values(resExamples)[0] : resExample;
      
      let responseValue = firstResponseContentExample?.value !== undefined 
        ? firstResponseContentExample.value 
        : firstResponseContentExample;
      
      responseValue = tryParse(responseValue);

      operations.push({
        id: crypto.randomUUID(),
        originalTag: tags[0],
        tag: tags[0],
        method: upperMethod as GeneratorOperation["method"],
        path,
        summary: operationSummary,
        description: operationDescription,
        contentType,
        requestFields: schemaToFields(requestSchema).map(field => {
          let rawExample = requestExample?.value !== undefined ? requestExample.value : requestExample;
          rawExample = tryParse(rawExample);

          if (rawExample && typeof rawExample === "object") {
             const val = (rawExample as any)[field.fieldName];
             if (val !== undefined) {
               return { ...field, sampleValue: typeof val === "object" ? JSON.stringify(val) : String(val) };
             }
          }
          return field;
        }),
        responseSchema: (() => {
          const baseSchema = responseValue ? { type: "object", example: responseValue, properties: (responseSchema as any).properties } : responseSchema;
          const currentProps = (baseSchema as any).properties || {};
          const currentExample = (baseSchema as any).example || {};
          
          const auditableProps: Record<string, any> = {};
          const auditableExample: Record<string, any> = {};
          
          ["createdBy", "modifiedBy", "createdDate", "modifiedDate"].forEach(field => {
            auditableProps[field] = { type: "string", description: `Audit field: ${field}` };
            auditableExample[field] = field.includes("Date") ? new Date().toISOString().split('T')[0] : "system";
          });

          return {
            ...baseSchema,
            properties: { ...currentProps, ...auditableProps },
            example: { ...currentExample, ...auditableExample }
          };
        })(),
        collapsed: true
      });
    });
  });

  return operations;
};

const fieldSchema = (field: SchemaField) => {
  if (field.isArray) {
    return {
      type: "array",
      items: {
        type: field.type
      }
    };
  }

  return {
    type: field.type
  };
};

export const buildOpenApiFromOperations = (
  title: string,
  version: string,
  description: string,
  operations: GeneratorOperation[]
) => {
  const paths: Record<string, Record<string, any>> = {};

  operations.forEach((operation) => {
    const reqProperties: Record<string, any> = {};
    operation.requestFields.forEach((field) => {
      if (!field.fieldName.trim()) return;
      reqProperties[field.fieldName.trim()] = fieldSchema(field);
    });

    if (!paths[operation.path]) {
      paths[operation.path] = {};
    }

    // Auto-detect path parameters from {paramName} tokens
    const pathParamMatches = [...operation.path.matchAll(/\{([^}]+)\}/g)];
    const pathParameters = pathParamMatches.map((match) => ({
      name: match[1],
      in: "path",
      required: true,
      schema: { type: "string" },
      description: `Path parameter: ${match[1]}`
    }));

    // Build request body — if all fields are arrays, wrap at top level
    const hasFields = Object.keys(reqProperties).length > 0;
    let requestBodySchema: any = { type: "object", properties: reqProperties };

    // Handle case where the content type implies an array body (schema.items missing fix)
    // If any property is missing type, default to string to avoid null items
    Object.keys(reqProperties).forEach((key) => {
      if (!reqProperties[key].type) {
        reqProperties[key] = { type: "string" };
      }
      // Ensure array items always have a type
      if (reqProperties[key].type === "array" && !reqProperties[key].items) {
        reqProperties[key].items = { type: "string" };
      }
    });

    // Fix response schema arrays — ensure items is always present
    const responseSchema = operation.responseSchema || { type: "object" };
    const fixedResponseSchema = fixArraySchema(responseSchema);

    paths[operation.path][operation.method.toLowerCase()] = {
      tags: [operation.tag],
      summary: operation.summary,
      ...(pathParameters.length > 0 ? { parameters: pathParameters } : {}),
      ...(hasFields
        ? {
            requestBody: {
              required: true,
              content: {
                [operation.contentType]: {
                  schema: requestBodySchema
                }
              }
            }
          }
        : {}),
      responses: {
        "200": {
          description: "Successful response",
          content: {
            "application/json": {
              schema: fixedResponseSchema
            }
          }
        }
      }
    };
  });

  return {
    openapi: "3.0.0",
    info: {
      title: title || "Generated API",
      version: version || "1.0.0",
      description
    },
    paths
  };
};

/** Recursively ensure any array schema has an items property */
const fixArraySchema = (schema: any): any => {
  if (!schema || typeof schema !== "object") return schema;

  if (schema.type === "array") {
    return {
      ...schema,
      items: schema.items ? fixArraySchema(schema.items) : { type: "object" }
    };
  }

  if (schema.properties) {
    const fixedProps: Record<string, any> = {};
    Object.entries(schema.properties).forEach(([key, val]) => {
      fixedProps[key] = fixArraySchema(val);
    });
    return { ...schema, properties: fixedProps };
  }

  if (schema.items) {
    return { ...schema, items: fixArraySchema(schema.items) };
  }

  return schema;
};

export const stringifyYaml = (doc: unknown) => YAML.stringify(doc);

const parseValue = (field: SchemaField): any => {
  if (field.isArray) {
    if (!field.sampleValue.trim()) {
      return [];
    }
    try {
      const parsed = JSON.parse(field.sampleValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return field.sampleValue
        .split(",")
        .map((chunk) => chunk.trim())
        .filter(Boolean);
    }
  }

  if (field.type === "integer") {
    return Number.parseInt(field.sampleValue || "0", 10);
  }

  if (field.type === "number") {
    return Number.parseFloat(field.sampleValue || "0");
  }

  if (field.type === "boolean") {
    return String(field.sampleValue).toLowerCase() === "true";
  }

  if (field.type === "object") {
    try {
      return field.sampleValue ? JSON.parse(field.sampleValue) : {};
    } catch {
      return {};
    }
  }

  return field.sampleValue;
};

export const fieldsToPayload = (fields: SchemaField[]) => {
  const payload: Record<string, any> = {};
  fields.forEach((field) => {
    if (!field.fieldName.trim()) {
      return;
    }
    payload[field.fieldName.trim()] = parseValue(field);
  });
  return payload;
};
