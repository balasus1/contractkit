import { EndpointContract, PrimitiveSchemaType, ProjectSetup, SchemaField } from "@/lib/types";

interface GeneratedFile {
  fileName: string;
  content: string;
}

interface JavaArtifacts {
  controllerFile: GeneratedFile;
  dtoFiles: GeneratedFile[];
}

const toPascalCase = (value: string) => {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
};

const toCamelCase = (value: string) => {
  const pascal = toPascalCase(value);
  if (!pascal) {
    return "value";
  }

  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const toSafePath = (path: string) => {
  if (!path.trim()) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
};

const toJavaBaseType = (type: PrimitiveSchemaType): string => {
  if (type === "integer") {
    return "Integer";
  }

  if (type === "number") {
    return "Double";
  }

  if (type === "boolean") {
    return "Boolean";
  }

  if (type === "object") {
    return "Map<String, Object>";
  }

  return "String";
};

const filterFields = (fields: SchemaField[]) => {
  return fields
    .filter((field) => field.fieldName.trim().length > 0)
    .map((field) => ({
      ...field,
      fieldName: toCamelCase(field.fieldName)
    }));
};

const renderDtoClass = (packageName: string, className: string, rawFields: SchemaField[]): string => {
  const fields = filterFields(rawFields);
  const fieldLines =
    fields.length > 0
      ? fields
          .map((field) => {
            const javaType = field.isArray ? `List<${toJavaBaseType(field.type)}>` : toJavaBaseType(field.type);
            return `    private ${javaType} ${field.fieldName};`;
          })
          .join("\n")
      : "    private String placeholder;";

  const accessorLines =
    fields.length > 0
      ? fields
          .map((field) => {
            const javaType = field.isArray ? `List<${toJavaBaseType(field.type)}>` : toJavaBaseType(field.type);
            const fieldPascal = toPascalCase(field.fieldName);
            return `\n    public ${javaType} get${fieldPascal}() {\n        return ${field.fieldName};\n    }\n\n    public void set${fieldPascal}(${javaType} ${field.fieldName}) {\n        this.${field.fieldName} = ${field.fieldName};\n    }`;
          })
          .join("\n")
      : `\n    public String getPlaceholder() {\n        return placeholder;\n    }\n\n    public void setPlaceholder(String placeholder) {\n        this.placeholder = placeholder;\n    }`;

  return `package ${packageName}.dto;\n\npublic class ${className} {\n${fieldLines}\n${accessorLines}\n}`;
};

const toHttpAnnotation = (method: EndpointContract["method"]): string => {
  if (method === "GET") {
    return "GetMapping";
  }

  if (method === "POST") {
    return "PostMapping";
  }

  if (method === "PUT") {
    return "PutMapping";
  }

  return "DeleteMapping";
};

export const generateJavaArtifacts = (setup: ProjectSetup, endpoints: EndpointContract[]): JavaArtifacts => {
  const basePackage = setup.basePackage.trim() || "com.example.contract";
  const controllerName = setup.controllerName.trim() || `${toPascalCase(setup.moduleName || "Contract")}Controller`;
  const serviceName = setup.serviceName.trim() || `${toPascalCase(setup.moduleName || "Contract")}Service`;
  const requestMapping = toSafePath(setup.baseRequestPath.trim() || "/api");

  const dtoFiles: GeneratedFile[] = [];
  const needsPreAuthorize = endpoints.some((endpoint) => endpoint.annotations.preAuthorizeEnabled);
  const needsLoggable = endpoints.some((endpoint) => endpoint.annotations.loggableEnabled);
  const needsJsonView = endpoints.some((endpoint) => endpoint.annotations.jsonViewEnabled);
  const allFields = endpoints.flatMap((endpoint) => [...endpoint.requestFields, ...endpoint.responseFields]);
  const needsListImport = allFields.some((field) => field.isArray);
  const needsMapImport = allFields.some((field) => field.type === "object");

  const methodBlocks = endpoints.map((endpoint, index) => {
    const baseClassName = toPascalCase(endpoint.endpointName || `Endpoint${index + 1}`) || `Endpoint${index + 1}`;
    const methodName = toCamelCase(endpoint.endpointName || `${endpoint.method} endpoint ${index + 1}`) + (index + 1);
    const requestDtoName = `${baseClassName}RequestDTO`;
    const responseDtoName = `${baseClassName}ResponseDTO`;

    dtoFiles.push({
      fileName: `${requestDtoName}.java`,
      content: renderDtoClass(basePackage, requestDtoName, endpoint.requestFields)
    });

    dtoFiles.push({
      fileName: `${responseDtoName}.java`,
      content: renderDtoClass(basePackage, responseDtoName, endpoint.responseFields)
    });

    const hasRequestBody = endpoint.method !== "GET" && filterFields(endpoint.requestFields).length > 0;
    const requestParam = hasRequestBody ? `@RequestBody ${requestDtoName} request` : "";
    const serviceArg = hasRequestBody ? "request" : "";

    const annotationLines: string[] = [];

    if (endpoint.annotations.preAuthorizeEnabled) {
      annotationLines.push(`    @PreAuthorize("${endpoint.annotations.preAuthorizeExpression || "isAuthenticated()"}")`);
    }

    if (endpoint.annotations.loggableEnabled) {
      annotationLines.push(`    @Loggable(action = "${endpoint.annotations.loggableAction || "READ-ACTION"}")`);
    }

    if (endpoint.annotations.jsonViewEnabled) {
      annotationLines.push(`    @JsonView(${endpoint.annotations.jsonViewClass || "KRIViews.ViewScreen.class"})`);
    }

    annotationLines.push(
      `    @Operation(summary = "${endpoint.endpointName || endpoint.method}", description = "Generated from API Contract Builder")`
    );
    annotationLines.push(`    @${toHttpAnnotation(endpoint.method)}("${toSafePath(endpoint.path)}")`);

    return `${annotationLines.join("\n")}\n    public ResponseEntity<${responseDtoName}> ${methodName}(${requestParam}) {\n        return ResponseEntity.ok(${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}.${methodName}(${serviceArg}));\n    }`;
  });

  const optionalImports = [
    needsListImport ? "import java.util.List;" : "",
    needsMapImport ? "import java.util.Map;" : "",
    needsPreAuthorize ? "import org.springframework.security.access.prepost.PreAuthorize;" : "",
    needsLoggable ? "import com.asymmetrix.grc.common.aspect.Loggable;" : "",
    needsJsonView ? "import com.fasterxml.jackson.annotation.JsonView;" : "",
    needsJsonView ? "import com.asymmetrix.grc.riskkri.utils.KRIViews;" : ""
  ]
    .filter(Boolean)
    .join("\n");

  const controllerContent = `package ${basePackage}.controller;\n\nimport ${basePackage}.dto.*;\nimport ${basePackage}.service.${serviceName};\nimport io.swagger.v3.oas.annotations.Operation;\nimport io.swagger.v3.oas.annotations.tags.Tag;\nimport org.springframework.http.ResponseEntity;\nimport org.springframework.web.bind.annotation.*;\n${optionalImports ? `${optionalImports}\n` : ""}\n@RestController\n@RequestMapping(\"${requestMapping}\")\n@Tag(name = \"${setup.moduleName || "Generated Module"}\", description = \"Generated APIs from API Contract Builder\")\npublic class ${controllerName} {\n\n    private final ${serviceName} ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)};\n\n    public ${controllerName}(${serviceName} ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)}) {\n        this.${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)} = ${serviceName.charAt(0).toLowerCase() + serviceName.slice(1)};\n    }\n\n${methodBlocks.join("\n\n")}\n}\n`;

  return {
    controllerFile: {
      fileName: `${controllerName}.java`,
      content: controllerContent
    },
    dtoFiles
  };
};
