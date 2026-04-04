import YAML from "yaml";

import { EndpointContract, PrimitiveSchemaType, SchemaField } from "@/lib/types";

const parseSampleValue = (value: string, type: PrimitiveSchemaType): unknown => {
  if (type === "object") {
    if (!value.trim()) {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }

  if (type === "boolean") {
    return value.toLowerCase() === "true";
  }

  if (type === "integer") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (type === "number") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return value;
};

const parseArraySample = (value: string, type: PrimitiveSchemaType): unknown[] => {
  if (!value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through and normalize manually.
  }

  return value
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => parseSampleValue(chunk, type));
};

const toProperties = (fields: SchemaField[]) => {
  const properties: Record<string, Record<string, unknown>> = {};

  fields.forEach((field) => {
    if (!field.fieldName.trim()) {
      return;
    }

    if (field.isArray) {
      properties[field.fieldName.trim()] = {
        type: "array",
        items: {
          type: field.type
        },
        example: parseArraySample(field.sampleValue, field.type)
      };
      return;
    }

    properties[field.fieldName.trim()] = {
      type: field.type,
      example: parseSampleValue(field.sampleValue, field.type)
    };
  });

  return properties;
};

export const createOpenApiDocument = (
  projectName: string,
  moduleName: string,
  apiVersion: string,
  endpoints: EndpointContract[]
) => {
  const paths: Record<string, Record<string, unknown>> = {};

  endpoints.forEach((endpoint) => {
    if (!endpoint.path.trim()) {
      return;
    }

    const methodKey = endpoint.method.toLowerCase();
    const requestProperties = toProperties(endpoint.requestFields);
    const responseProperties = toProperties(endpoint.responseFields);

    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }

    paths[endpoint.path][methodKey] = {
      summary: endpoint.endpointName || `${endpoint.method} ${endpoint.path}`,
      ...(Object.keys(requestProperties).length
        ? {
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: requestProperties
                  }
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
              schema: {
                type: "object",
                properties: responseProperties
              }
            }
          }
        }
      }
    };
  });

  const doc = {
    openapi: "3.0.0",
    info: {
      title: projectName || "API Contract",
      version: apiVersion.trim() || "1.0.0",
      ...(moduleName.trim() ? { description: `Module: ${moduleName.trim()}` } : {})
    },
    paths
  };

  return {
    doc,
    yaml: YAML.stringify(doc)
  };
};
