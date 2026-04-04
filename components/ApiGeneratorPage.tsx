"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  Play,
  Plus,
  Save,
  Search,
  Upload,
  UploadCloud,
  GripVertical,
  GripHorizontal,
  Trash2,
  Edit,
  Check,
  Shield,
  Github,
  X
} from "lucide-react";

const AUDITABLE_FIELDS = ["createdBy", "modifiedBy", "createdDate", "modifiedDate", "lastUpdatedBy", "lastUpdatedDate"];

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TextareaAutosize from "react-textarea-autosize";

import {
  buildOpenApiFromOperations,
  extractOperationsByTag,
  fieldsToPayload,
  generateAngularServices,
  generateSpringControllers,
  GeneratorOperation,
  parseOpenApiFromText,
  stringifyYaml
} from "@/lib/apiGenerator";
import { SchemaField } from "@/lib/types";

const SUPPORTED_METHODS: GeneratorOperation["method"][] = ["GET", "POST", "PUT", "DELETE", "PATCH"];
const CONTENT_TYPES = ["application/json", "multipart/form-data", "application/x-www-form-urlencoded"];
const SWAGGER_CANDIDATES = ["/v3/api-docs", "/v3/api-docs.yaml", "/v2/api-docs"];

const METHOD_STYLES: Record<string, any> = {
  GET: { 
    bg: "bg-[#ebf3fb]", 
    border: "border-[#61affe]", 
    text: "text-[#61affe]",
    badge: "bg-[#61affe]",
    hover: "hover:bg-[#d9e7f7]"
  },
  POST: { 
    bg: "bg-[#e8f6f0]", 
    border: "border-[#49cc90]", 
    text: "text-[#49cc90]",
    badge: "bg-[#49cc90]",
    hover: "hover:bg-[#d8efe4]"
  },
  PUT: { 
    bg: "bg-[#fbf1e6]", 
    border: "border-[#fca130]", 
    text: "text-[#fca130]",
    badge: "bg-[#fca130]",
    hover: "hover:bg-[#f7e4ce]"
  },
  DELETE: { 
    bg: "bg-[#fae9e9]", 
    border: "border-[#f93e3e]", 
    text: "text-[#f93e3e]",
    badge: "bg-[#f93e3e]",
    hover: "hover:bg-[#f2d1d1]"
  },
  PATCH: { 
    bg: "bg-[#e7f5f3]", 
    border: "border-[#50e3c2]", 
    text: "text-[#50e3c2]",
    badge: "bg-[#50e3c2]",
    hover: "hover:bg-[#d5ece8]"
  }
};

const createField = (): SchemaField => ({
  id: crypto.randomUUID(),
  fieldName: "",
  type: "string",
  sampleValue: "",
  comment: ""
});

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function TreeView({ value, level = 0 }: { value: unknown; level?: number }) {
  if (Array.isArray(value)) {
    return (
      <div className="pl-3">
        <div className="text-slate-300">[</div>
        {value.map((item, index) => (
          <TreeView key={`${index}-${level}`} value={item} level={level + 1} />
        ))}
        <div className="text-slate-300">]</div>
      </div>
    );
  }

  if (isObject(value)) {
    return (
      <div className="pl-3">
        <div className="text-slate-300">{"{"}</div>
        {Object.entries(value).map(([key, item]) => (
          <div key={`${key}-${level}`} className="pl-3">
            <span className="text-sky-300">{key}</span>
            <span className="text-slate-500">: </span>
            {typeof item === "object" ? <TreeView value={item} level={level + 1} /> : <span className="text-emerald-300">{String(item)}</span>}
          </div>
        ))}
        <div className="text-slate-300">{"}"}</div>
      </div>
    );
  }

  return <span className="text-emerald-300">{String(value)}</span>;
}



// Request/Response table row
function FieldRow({
  field,
  isLast,
  onUpdate,
  onRemove,
  onAdd,
  onCopy
}: {
  field: SchemaField;
  isLast: boolean;
  onUpdate: (patch: Partial<SchemaField>) => void;
  onRemove: () => void;
  onAdd: () => void;
  onCopy: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-t border-slate-200">
      <td className="px-1 py-2 align-top">
        <button {...attributes} {...listeners} className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-2 align-top">
        <div className="space-y-1">
          <input
            value={field.fieldName}
            onChange={(event) => onUpdate({ fieldName: event.target.value })}
            className={`w-full rounded-md border px-2 py-1.5 text-sm transition-all focus:outline-none focus:ring-1 ${
              AUDITABLE_FIELDS.includes(field.fieldName) 
                ? "border-rose-500 bg-rose-50 text-rose-900 focus:border-rose-600 focus:ring-rose-200" 
                : "border-slate-300 focus:border-slate-900 focus:ring-slate-200"
            }`}
          />
          {AUDITABLE_FIELDS.includes(field.fieldName) && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 animate-in fade-in slide-in-from-top-1 duration-200">
              <Shield className="h-3 w-3" />
              <span>Restricted: Managed by Audit System</span>
            </div>
          )}
        </div>
      </td>
      <td className="px-2 py-2 align-top">
        <select
          value={field.type}
          onChange={(event) => onUpdate({ type: event.target.value as SchemaField["type"] })}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        >
          {["string", "integer", "number", "boolean", "object", "array", "float", "double"].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2 align-top">
        <TextareaAutosize
          value={field.sampleValue}
          onChange={(event) => onUpdate({ sampleValue: event.target.value })}
          minRows={1}
          className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
        />
      </td>
      <td className="px-2 py-2 align-top">
        <TextareaAutosize
          value={field.comment || ""}
          onChange={(event) => onUpdate({ comment: event.target.value })}
          minRows={1}
          className="w-full resize-none rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
        />
      </td>
      <td className="px-2 py-2 align-top">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700"
          >
            -
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

// Request/Response table wrapper
function SchemaTable({
  title,
  fields,
  onChange,
  onSave
}: {
  title: string;
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  onSave: () => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const updateField = (id: string, patch: Partial<SchemaField>) => {
    onChange(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const addRow = () => onChange([...fields, createField()]);
  const copyRow = (field: SchemaField) => onChange([...fields, { ...field, id: crypto.randomUUID() }]);
  const removeRow = (id: string) => {
    const next = fields.filter((field) => field.id !== id);
    onChange(next.length ? next : [createField()]);
  };

  const hasError = fields.some((f) => AUDITABLE_FIELDS.includes(f.fieldName));

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <button
          type="button"
          disabled={hasError}
          onClick={onSave}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all ${
            hasError ? "bg-slate-300 cursor-not-allowed opacity-70" : "bg-slate-900 hover:bg-slate-700 shadow-sm active:scale-95"
          }`}
          title={hasError ? "Cannot save with restricted field names" : "Save changes"}
        >
          {hasError ? "Fix Errors" : "Save"}
        </button>
      </div>
      <div className="mt-2 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="w-10 px-1 py-2"></th>
              <th className="px-2 py-2">Attribute</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Value</th>
              <th className="px-2 py-2">Comments</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {fields.map((field, index) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  isLast={index === fields.length - 1}
                  onUpdate={(patch) => updateField(field.id, patch)}
                  onRemove={() => removeRow(field.id)}
                  onAdd={addRow}
                  onCopy={() => copyRow(field)}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
        </DndContext>
      </div>
    </div>
  );
}

function OperationCard({
  operation,
  setOperation,
  removeOperation,
  saveMetadata
}: {
  operation: GeneratorOperation;
  setOperation: (id: string, updater: (current: GeneratorOperation) => GeneratorOperation) => void;
  removeOperation: (id: string) => void;
  saveMetadata: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: operation.id });
  const [copiedReq, setCopiedReq] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 1
  };

  const mStyle = METHOD_STYLES[operation.method] || METHOD_STYLES.GET;

  const handleCopy = async (e: React.MouseEvent, target: "req" | "res") => {
    e.stopPropagation();
    const content = target === "req" 
      ? JSON.stringify(fieldsToPayload(operation.requestFields), null, 2)
      : operation.responseSchema && (operation.responseSchema as any).example 
        ? JSON.stringify((operation.responseSchema as any).example, null, 2)
        : "{}";
    
    await navigator.clipboard.writeText(content);
    if (target === "req") {
      setCopiedReq(true);
      setTimeout(() => setCopiedReq(false), 2000);
    } else {
      setCopiedRes(true);
      setTimeout(() => setCopiedRes(false), 2000);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`overflow-hidden rounded-lg border-2 ${mStyle.border} ${mStyle.bg} shadow-sm transition-all`}
    >
      <header className={`flex items-center justify-between px-4 py-2 cursor-pointer ${mStyle.hover}`}
        onClick={() => setOperation(operation.id, (current) => ({ ...current, collapsed: !current.collapsed }))}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab p-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing shrink-0" onClick={(e) => e.stopPropagation()}>
            <GripHorizontal className="h-4 w-4" />
          </div>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 py-1">
              {operation.collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              
              <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <select
                  value={operation.method}
                  onChange={(e) => setOperation(operation.id, (curr) => ({ ...curr, method: e.target.value as any }))}
                  className={`appearance-none min-w-[70px] cursor-pointer rounded px-2.5 py-1 text-center text-xs font-bold text-white transition-opacity hover:opacity-90 focus:outline-none ${mStyle.badge}`}
                >
                  {SUPPORTED_METHODS.map(m => <option key={m} value={m} className="text-slate-800 bg-white">{m}</option>)}
                </select>
              </div>

              <div className="relative flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                <input
                  value={operation.path}
                  onChange={(event) => setOperation(operation.id, (current) => ({ ...current, path: event.target.value }))}
                  className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:outline-none focus:ring-0 w-auto min-w-[20px]"
                  style={{ width: `${Math.max(operation.path.length, 1) + 2}ch` }}
                />
              </div>
            </div>
            {operation.description && (
              <div className="pl-6 pb-1">
                <span className="text-xs text-slate-500 font-medium break-words block italic">
                  {operation.description}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button
             type="button"
             onClick={(e) => { e.stopPropagation(); removeOperation(operation.id); }}
             className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-all"
           >
             <Trash2 className="h-4 w-4" />
           </button>
        </div>
      </header>

      {operation.collapsed ? null : (
        <div className="bg-white border-t border-slate-200 p-5 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Summary</span>
              <input
                value={operation.summary}
                onChange={(event) =>
                  setOperation(operation.id, (current) => ({ ...current, summary: event.target.value }))
                }
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:ring-0"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Content Type</span>
              <select
                value={operation.contentType}
                onChange={(event) =>
                  setOperation(operation.id, (current) => ({ ...current, contentType: event.target.value }))
                }
                className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:ring-0"
              >
                {CONTENT_TYPES.map((contentType) => (
                  <option key={contentType} value={contentType}>
                    {contentType}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Implementation Tables */}
          <div className="space-y-6">
            <SchemaTable
              title="Parameters Implementation"
              fields={operation.requestFields.filter(f => !AUDITABLE_FIELDS.includes(f.fieldName))}
              onChange={(fields) => {
                const nonAudits = fields.filter(f => !AUDITABLE_FIELDS.includes(f.fieldName));
                const audits = operation.requestFields.filter(f => AUDITABLE_FIELDS.includes(f.fieldName));
                setOperation(operation.id, (current) => ({ ...current, requestFields: [...nonAudits, ...audits] }));
              }}
              onSave={saveMetadata}
            />
            
            <div className="space-y-4">
              <SchemaTable
                title="Response Model Implementation"
                fields={
                  (operation.responseSchema && (operation.responseSchema as any).properties 
                    ? Object.entries((operation.responseSchema as any).properties)
                        .filter(([key]) => !AUDITABLE_FIELDS.includes(key))
                        .map(([key, value]: any) => ({
                          id: crypto.randomUUID(),
                          fieldName: key,
                          type: (value as any)?.type || "string",
                          sampleValue: (value as any)?.example ? JSON.stringify((value as any).example) : "",
                          comment: (value as any)?.description || ""
                        })) 
                    : [createField()]
                  )
                }
                onChange={(fields) =>
                  setOperation(operation.id, (current) => {
                    const existingProps = (current.responseSchema as any)?.properties || {};
                    const auditProps = Object.keys(existingProps)
                      .filter(k => AUDITABLE_FIELDS.includes(k))
                      .reduce((acc, k) => ({ ...acc, [k]: existingProps[k] }), {});

                    return {
                      ...current,
                      responseSchema: {
                        type: "object",
                        properties: {
                          ...fields.reduce((acc, field) => {
                            acc[field.fieldName || "field"] = { type: field.type, description: field.comment };
                            return acc;
                          }, {} as Record<string, any>),
                          ...auditProps
                        }
                      }
                    };
                  })
                }
                onSave={saveMetadata}
              />
            </div>
          </div>

          {/* Combined Preview Grid - NOW AT BOTTOM */}
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            {/* Request Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h4 className="text-sm font-bold text-slate-800">
                  Request body <span className="text-rose-500 font-normal lowercase italic ml-1">required</span>
                </h4>
                <button 
                  onClick={(e) => handleCopy(e, "req")}
                  className="flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                >
                  {copiedReq ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedReq ? "Copied!" : "Copy Payload"}
                </button>
              </div>
              <div className="rounded border bg-[#2d3133] p-4 h-[250px] overflow-auto scrollbar-thin">
                <pre className="text-xs text-white leading-relaxed font-mono">
                  {JSON.stringify(fieldsToPayload(operation.requestFields), null, 2)}
                </pre>
              </div>
            </div>

            {/* Response Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  Responses <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">200</span>
                </h4>
                <button 
                  onClick={(e) => handleCopy(e, "res")}
                  className="flex items-center gap-1.5 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200"
                >
                  {copiedRes ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedRes ? "Copied!" : "Copy Payload"}
                </button>
              </div>
              <div className="rounded border bg-[#2d3133] p-4 h-[250px] overflow-auto scrollbar-thin">
                <pre className="text-xs text-white leading-relaxed font-mono">
                  {operation.responseSchema && (operation.responseSchema as any).example 
                    ? JSON.stringify((operation.responseSchema as any).example, null, 2)
                    : "{}"}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewPanel({ requestFields, responseSchema }: { requestFields: SchemaField[]; responseSchema: unknown }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="max-h-[300px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 scrollbar-thin">
        <h4 className="text-sm font-semibold text-slate-800">Request Body</h4>
        <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-slate-700">
          {JSON.stringify(fieldsToPayload(requestFields), null, 2)}
        </pre>
      </div>
      <div className="max-h-[300px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 scrollbar-thin">
        <h4 className="text-sm font-semibold text-slate-800">Response</h4>
        <TreeView value={responseSchema} />
      </div>
    </div>
  );
}

function PublishPanel({
  publishConfig,
  setPublishConfig,
  publishStatus,
  publishBundle
}: {
  publishConfig: {
    owner: string;
    repo: string;
    tag: string;
    assetName: string;
    releaseNotes: string;
    token: string;
  };
  setPublishConfig: (next: any) => void;
  publishStatus: string;
  publishBundle: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <Github className="h-5 w-5 text-slate-900" />
        <h3 className="text-base font-semibold text-slate-900 uppercase">GitHub Release</h3>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
          <input
            value={publishConfig.owner}
            onChange={(event) => setPublishConfig((prev: any) => ({ ...prev, owner: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repository</span>
          <input
            value={publishConfig.repo}
            onChange={(event) => setPublishConfig((prev: any) => ({ ...prev, repo: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release Tag</span>
          <input
            value={publishConfig.tag}
            onChange={(event) => setPublishConfig((prev: any) => ({ ...prev, tag: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asset Name</span>
          <input
            value={publishConfig.assetName}
            onChange={(event) => setPublishConfig((prev: any) => ({ ...prev, assetName: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release Notes</span>
          <textarea
            value={publishConfig.releaseNotes}
            onChange={(event) => setPublishConfig((prev: any) => ({ ...prev, releaseNotes: event.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Personal Access Token (PAT)</span>
          <input
            type="password"
            value={publishConfig.token}
            onChange={(event) => setPublishConfig((prev: any) => ({ ...prev, token: event.target.value }))}
            placeholder="Paste your GITHUB PAT token here"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={publishBundle}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        <UploadCloud className="h-4 w-4" />
        Publish
      </button>

      {publishStatus ? <p className="mt-2 text-sm text-slate-700">{publishStatus}</p> : null}
    </section>
  );
}

export function ApiGeneratorPage({ onActivity }: { onActivity?: (message: string) => void }) {
  const [swaggerUrl, setSwaggerUrl] = useState("");
  const [operations, setOperations] = useState<GeneratorOperation[]>([]);
  const [title, setTitle] = useState("Generated API");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");

  const [resolvedSpecUrl, setResolvedSpecUrl] = useState("");

  const [swaggerSources, setSwaggerSources] = useState<{ id: string; name: string; description: string; url: string }[]>([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceDescription, setSourceDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const [publishConfig, setPublishConfig] = useState({
    owner: "",
    repo: "",
    tag: "v1.0.0",
    assetName: "openapi-spec.yaml",
    releaseNotes: "",
    token: ""
  });
  const [publishStatus, setPublishStatus] = useState("");
  const [collapsedTags, setCollapsedTags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [toast, setToast] = useState<{ message: string; duration: number } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const tags = useMemo(() => Array.from(new Set(operations.map((operation) => operation.tag))), [operations]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSourceModal(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const setOperation = (id: string, updater: (current: GeneratorOperation) => GeneratorOperation) => {
    setOperations((prev) => prev.map((operation) => (operation.id === id ? updater(operation) : operation)));
  };

  const removeOperation = (id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  };

  const saveMetadata = () => {
    // Placeholder for future MSSQL persistence hook
    onActivity?.("Metadata saved (local mock).");
  };

  const loadFromUrl = async (incomingUrl?: string) => {
    const target = (incomingUrl || swaggerUrl).trim();
    if (!target) {
      setLoadError("Swagger/OpenAPI URL is required.");
      return;
    }

    setLoading(true);
    setLoadError("");
    setResolvedSpecUrl("");
    try {
      const normalizedInput = target.replace(/#.*$/, "");
      const candidates = new Set<string>([normalizedInput]);
      const swaggerIndex = normalizedInput.indexOf("/swagger-ui");
      if (swaggerIndex > -1) {
        const base = normalizedInput.slice(0, swaggerIndex);
        SWAGGER_CANDIDATES.forEach((path) => candidates.add(`${base}${path}`));
      }
      if (normalizedInput.endsWith("/swagger-ui.html")) {
        const base = normalizedInput.replace("/swagger-ui.html", "");
        SWAGGER_CANDIDATES.forEach((path) => candidates.add(`${base}${path}`));
      }

      let parsedSpec: ReturnType<typeof parseOpenApiFromText> | null = null;
      let usedUrl = "";
      const errors: string[] = [];

      for (const candidate of candidates) {
        const proxyResponse = await fetch(`/api/openapi-proxy?url=${encodeURIComponent(candidate)}`);
        if (!proxyResponse.ok) {
          errors.push(`${candidate} -> ${proxyResponse.status}`);
          continue;
        }

        const raw = await proxyResponse.text();
        try {
          const parsed = parseOpenApiFromText(raw);
          if (parsed && parsed.paths && Object.keys(parsed.paths).length) {
            parsedSpec = parsed;
            usedUrl = candidate;
            break;
          }
          errors.push(`${candidate} -> Not an OpenAPI spec`);
        } catch {
          errors.push(`${candidate} -> Parse failed`);
        }
      }

      if (!parsedSpec) {
        throw new Error(`Could not resolve OpenAPI spec. Tried: ${errors.join(" | ")}`);
      }

      const extracted = extractOperationsByTag(parsedSpec);
      setOperations(extracted);
      setTitle(parsedSpec.info?.title || "Generated API");
      setVersion(parsedSpec.info?.version || "1.0.0");
      setDescription(parsedSpec.info?.description || "");
      setResolvedSpecUrl(usedUrl);
      onActivity?.(`Loaded ${extracted.length} operations from ${usedUrl}.`);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load OpenAPI.");
    } finally {
      setLoading(false);
    }
  };

  const operationsSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndOperations = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOperations((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const slugify = (text: string) => 
    text.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-');

  const updateTitle = (newTitle: string) => {
    setTitle(newTitle);
    setPublishConfig(prev => ({ 
      ...prev, 
      assetName: newTitle.trim() ? `${slugify(newTitle)}.yaml` : prev.assetName 
    }));
  };

  const downloadFile = (fileName: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const fileNamePrefix = title.trim() ? slugify(title) : "openapi-generated";

  const exportJson = () => {
    const openapi = buildOpenApiFromOperations(title, version, description, operations);
    downloadFile(`${fileNamePrefix}.json`, JSON.stringify(openapi, null, 2), "application/json");
  };

  const exportYaml = () => {
    const openapi = buildOpenApiFromOperations(title, version, description, operations);
    downloadFile(`${fileNamePrefix}.yaml`, stringifyYaml(openapi), "application/yaml");
  };

  const publishBundle = async () => {
    // Helper to extract owner and repo from various inputs
    const extractRepoInfo = (ownerIn: string, repoIn: string) => {
      let finalOwner = ownerIn.trim();
      let finalRepo = repoIn.trim();

      // If repoIn is a full URL
      if (finalRepo.includes("github.com/")) {
        const parts = finalRepo.split("github.com/")[1].split("/");
        if (parts.length >= 2) {
          finalOwner = parts[0];
          finalRepo = parts[1].replace(".git", "");
        }
      }

      return { owner: finalOwner, repo: finalRepo };
    };

    const info = extractRepoInfo(publishConfig.owner, publishConfig.repo);

    if (!info.owner || !info.repo || !publishConfig.tag || !publishConfig.assetName || !publishConfig.token) {
      setPublishStatus("Owner/repo/tag/asset/token are required.");
      return;
    }

    setPublishStatus(`Verifying repository ${info.owner}/${info.repo}...`);
    try {
      const openapi = buildOpenApiFromOperations(title, version, description, operations);
      const yamlContent = stringifyYaml(openapi);

      const baseRepoUrl = `https://api.github.com/repos/${info.owner}/${info.repo}`;
      const commonHeaders = {
        Authorization: `Bearer ${publishConfig.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
      };

      // Step 1: Verify the repo exists and is accessible
      const repoCheck = await fetch(baseRepoUrl, { method: "GET", headers: commonHeaders });
      if (repoCheck.status === 404) {
        throw new Error(
          `Repository "${info.owner}/${info.repo}" not found. ` +
          `Please check: (1) Owner and repo name are correct, (2) Your PAT has "repo" scope, ` +
          `(3) The repo exists and you have access to it.`
        );
      }
      if (repoCheck.status === 401) {
        throw new Error(`Unauthorized — your PAT is invalid or expired. Please generate a new token with "repo" scope.`);
      }
      if (!repoCheck.ok) {
        throw new Error(`Could not access repository: HTTP ${repoCheck.status}`);
      }

      let releaseId: number | null = null;
      setPublishStatus(`Checking for release tag "${publishConfig.tag}"...`);
      
      const findRelease = await fetch(`${baseRepoUrl}/releases/tags/${encodeURIComponent(publishConfig.tag)}`, {
        method: "GET",
        headers: commonHeaders
      });

      if (findRelease.ok) {
        const data = await findRelease.json();
        releaseId = data.id as number;
        setPublishStatus(`Found existing release "${publishConfig.tag}", uploading asset...`);
      } else if (findRelease.status === 404) {
        setPublishStatus(`Creating new release "${publishConfig.tag}"...`);
        const createRelease = await fetch(`${baseRepoUrl}/releases`, {
          method: "POST",
          headers: { ...commonHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            tag_name: publishConfig.tag,
            name: `API Contract ${publishConfig.tag}`,
            body: publishConfig.releaseNotes || "Generated via API Contract Builder"
          })
        });
        if (!createRelease.ok) {
          const errText = await createRelease.text();
          throw new Error(
            `Failed to create release "${publishConfig.tag}" on ${info.owner}/${info.repo}. ` +
            `Ensure your PAT has "repo" write access. Details: ${errText}`
          );
        }
        const created = await createRelease.json();
        releaseId = created.id as number;
      }

      if (!releaseId) {
        throw new Error("Could not resolve release id.");
      }

      setPublishStatus(`Uploading ${publishConfig.assetName}...`);
      const uploadUrl = `https://uploads.github.com/repos/${info.owner}/${info.repo}/releases/${releaseId}/assets?name=${encodeURIComponent(publishConfig.assetName)}`;
      const upload = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          ...commonHeaders,
          "Content-Type": "application/x-yaml"
        },
        body: yamlContent
      });

      if (!upload.ok) {
        throw new Error(`Failed to upload YAML: ${await upload.text()}`);
      }

      setPublishStatus("");
      setToast({ message: "Successfully published to GitHub!", duration: 4500 });
      onActivity?.(`OpenAPI YAML (${publishConfig.assetName}) published to ${info.owner}/${info.repo} release ${publishConfig.tag}.`);
    } catch (error) {
      setPublishStatus(error instanceof Error ? error.message : "Publish failed");
    }
  };

  const saveSwaggerSource = (closeAfter = false) => {
    const name = sourceName.trim();
    const url = sourceUrl.trim();
    
    if (name && url) {
      if (sourceId) {
        setSwaggerSources((prev) =>
          prev.map((s) => (s.id === sourceId ? { ...s, name, description: sourceDescription.trim(), url } : s))
        );
      } else {
        const entry = { id: crypto.randomUUID(), name, description: sourceDescription.trim(), url };
        setSwaggerSources((prev) => [...prev, entry]);
      }
      onActivity?.(`${name} Swagger saved.`);
    }

    // Only clear if we actually had something OR if we are closing anyway
    if ((name && url) || closeAfter) {
      setSourceId(null);
      setSourceName("");
      setSourceDescription("");
      setSourceUrl("");
    }

    if (closeAfter) {
      setShowSourceModal(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">API Contract Builder</h2>
            <p className="mt-1 text-sm text-slate-600">
              Load OpenAPI URL, edit grouped controllers/endpoints, extract annotations, and publish generated bundles.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSourceModal(true)}
            className="group relative -mt-4 flex items-center justify-start rounded-xl border border-slate-200 bg-white p-2 text-slate-400 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) hover:w-[190px] w-9 overflow-hidden whitespace-nowrap animate-pulse hover:animate-none"
            title="Manage Sources (Ctrl+k)"
          >
            <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Search className="relative z-10 h-5 w-5 shrink-0 text-slate-700 group-hover:text-slate-900 transition-colors" />
            <span className="relative z-10 ml-2.5 opacity-0 transition-opacity duration-700 delay-100 group-hover:opacity-100 text-[13px] font-semibold tracking-tight text-slate-800">
              Manage Sources <span className="ml-1 text-[12px] font-normal opacity-50 text-slate-900">Ctrl+k</span>
            </span>
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative group">
            <select
              value={swaggerUrl}
              onChange={(event) => setSwaggerUrl(event.target.value)}
              style={{ width: swaggerUrl ? "auto" : "100%", minWidth: "200px" }}
              className="appearance-none w-full rounded-xl border border-slate-300 pl-3 pr-10 py-2.5 text-sm transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
            >
              <option value="">Select or paste swagger URL</option>
              {swaggerSources.map((source) => (
                <option key={source.id} value={source.url}>
                  {source.name} {source.description ? ` - ${source.description}` : ""} - {source.url}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadFromUrl()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Load OpenAPI
          </button>
        </div>

        {loadError ? <p className="mt-2 text-sm text-rose-700">{loadError}</p> : null}
        {resolvedSpecUrl ? <p className="mt-2 text-sm text-emerald-700">Loaded from: {resolvedSpecUrl}</p> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
            <input
              value={title}
              onChange={(event) => updateTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</span>
            <input
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
            <TextareaAutosize
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minRows={1}
              className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* Premium Multi-Gradient Auditable Information Card */}
      <div className="mt-8 overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-px shadow-lg transition-all hover:shadow-xl">
        <div className="flex flex-col items-start gap-4 rounded-[15px] bg-white/95 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200/50 shadow-lg ring-4 ring-emerald-50">
            <Shield className="h-7 w-7 text-white" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-extrabold tracking-tight text-slate-900">Compliance & Audit Readiness</h4>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200">
                System Default
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              The following audit trails are <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">automatically embedded</span> in every API contract response to ensure governance and traceability.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-3 pt-2">
              <div className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-blue-400 hover:shadow-md">
                <span className="text-xs font-black tracking-widest text-blue-600 transition-colors group-hover:text-blue-700">createdBy:</span>
                <span className="text-xs font-bold text-slate-500">String</span>
              </div>
              <div className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md">
                <span className="text-xs font-black tracking-widest text-emerald-600 transition-colors group-hover:text-emerald-700">createdDate:</span>
                <span className="text-xs font-bold text-slate-500">Date()</span>
              </div>
              <div className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-violet-400 hover:shadow-md">
                <span className="text-xs font-black tracking-widest text-violet-600 transition-colors group-hover:text-violet-700">modifiedBy:</span>
                <span className="text-xs font-bold text-slate-500">String</span>
              </div>
              <div className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-all hover:border-rose-400 hover:shadow-md">
                <span className="text-xs font-black tracking-widest text-rose-600 transition-colors group-hover:text-rose-700">modifiedDate:</span>
                <span className="text-xs font-bold text-slate-500">Date()</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-8 space-y-10">
        {tags.map((tag) => {
          const tagOperations = operations.filter(op => op.tag === tag);
          const isTagCollapsed = collapsedTags[tag];

          return (
            <div key={tag} className="space-y-4">
              <header 
                className="flex items-center justify-between border-b-2 border-slate-200 pb-2 cursor-pointer hover:bg-slate-50 px-2 transition-all"
                onClick={() => setCollapsedTags(prev => ({ ...prev, [tag]: !prev[tag] }))}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 max-w-[80%]">
                  <h3 className="text-xl font-bold text-slate-800">{tag}</h3>
                  <span className="text-sm text-slate-500 font-medium">
                    APIs for managing {tag.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown className={`h-6 w-6 text-slate-400 transition-transform ${isTagCollapsed ? "-rotate-90" : ""}`} />
                </div>
              </header>

              {!isTagCollapsed && (
                <div className="space-y-3">
                  <DndContext
                    sensors={operationsSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndOperations}
                  >
                    <SortableContext items={tagOperations.map(o => o.id)} strategy={verticalListSortingStrategy}>
                      {tagOperations.map((operation) => (
                        <OperationCard
                          key={operation.id}
                          operation={operation}
                          setOperation={setOperation}
                          removeOperation={removeOperation}
                          saveMetadata={saveMetadata}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <button
                    type="button"
                    onClick={() => {
                      const lastOp = tagOperations[tagOperations.length - 1];
                      const newOp: GeneratorOperation = lastOp ? {
                        ...lastOp,
                        id: crypto.randomUUID(),
                        path: lastOp.path + "-copy",
                        summary: lastOp.summary + " (Copy)",
                        collapsed: false,
                        requestFields: lastOp.requestFields.map(f => ({ ...f, id: crypto.randomUUID() }))
                      } : {
                        id: crypto.randomUUID(),
                        originalTag: tag,
                        tag: tag,
                        method: "POST",
                        path: "/new-endpoint",
                        summary: "New endpoint",
                        contentType: "application/json",
                        requestFields: [createField()],
                        responseSchema: { type: "object" },
                        collapsed: false
                      };
                      setOperations((prev) => [...prev, newOp]);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Endpoint to {tag}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {tags.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-slate-500 font-medium">No controllers found. Load a swagger doc or add a new controller below.</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const lastOp = operations[operations.length - 1];
              const newOp: GeneratorOperation = {
                id: crypto.randomUUID(),
                originalTag: lastOp ? `${lastOp.tag} New` : "New Controller",
                tag: lastOp ? `${lastOp.tag} New` : "New Controller",
                method: "POST",
                path: "/new-endpoint",
                summary: "New endpoint",
                contentType: "application/json",
                requestFields: [createField()],
                responseSchema: { type: "object" },
                collapsed: false
              };
              setOperations((prev) => [...prev, newOp]);
            }}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-900 bg-white px-6 py-2.5 text-sm font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Controller
          </button>

          <div className="ml-auto flex gap-3">
            <button
              type="button"
              onClick={exportJson}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5 text-sky-500" />
              JSON
            </button>
            <button
              type="button"
              onClick={exportYaml}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5 text-amber-500" />
              YAML
            </button>
            <button
              type="button"
              onClick={saveMetadata}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2 text-sm font-bold tracking-tight text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>
        </div>
      </section>

      <PublishPanel
        publishConfig={publishConfig}
        setPublishConfig={setPublishConfig}
        publishStatus={publishStatus}
        publishBundle={publishBundle}
      />

      {/* Swagger Sources Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-slate-900">Swagger Sources</h3>
              <button 
                onClick={() => saveSwaggerSource(true)} 
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                title="Save & Close"
              >
                 <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-6">Add or edit saved Swagger/OpenAPI sources.</p>
            
            <div className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Name</span>
                <input
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. Risk Management API"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Description</span>
                <input
                  value={sourceDescription}
                  onChange={(e) => setSourceDescription(e.target.value)}
                  placeholder="Short description of this API"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Swagger URL</span>
                <input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://api.example.com/v3/api-docs"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => saveSwaggerSource(false)}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition-colors shadow-sm"
              >
                {sourceId ? "Update Source" : "Save Source"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceId(null);
                  setSourceName("");
                  setSourceDescription("");
                  setSourceUrl("");
                  setShowSourceModal(false);
                }}
                className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* List of saved servers/sources with Edit/Delete */}
            {swaggerSources.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Saved Sources</h4>
                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                  {swaggerSources.map((source) => (
                    <div key={source.id} className="group relative rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-slate-300 hover:bg-white">
                      <div 
                        className="pr-16 cursor-pointer"
                        onClick={() => {
                          setSwaggerUrl(source.url);
                          setShowSourceModal(false);
                          onActivity?.(`${source.name} Swagger loaded from sources.`);
                        }}
                      >
                        <div className="text-sm font-bold text-slate-900 truncate">{source.name}</div>
                        <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{source.url}</div>
                      </div>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSourceId(source.id);
                            setSourceName(source.name);
                            setSourceDescription(source.description);
                            setSourceUrl(source.url);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setSwaggerSources(prev => prev.filter(s => s.id !== source.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Toast - bottom right */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] w-80 rounded-xl border border-emerald-100 bg-white p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-bold text-slate-900">Published Successfully</p>
              <p className="mt-0.5 text-xs text-slate-500">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ animation: `toast-shrink ${toast.duration}ms linear forwards` }}
            />
          </div>
          <style>{`
            @keyframes toast-shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
