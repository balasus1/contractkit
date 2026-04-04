import { Trash2 } from "lucide-react";

import { EndpointContract, HttpMethod, SchemaField } from "@/lib/types";
import { SchemaTable } from "@/components/SchemaTable";

const METHOD_OPTIONS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE"];

interface EndpointCardProps {
  endpoint: EndpointContract;
  onChange: (next: EndpointContract) => void;
  onDelete: () => void;
}

const createField = (): SchemaField => ({
  id: crypto.randomUUID(),
  fieldName: "",
  type: "string",
  isArray: false,
  sampleValue: ""
});

export function EndpointCard({ endpoint, onChange, onDelete }: EndpointCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-lg sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-2 rounded-full bg-slate-900"></div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Endpoint Definition</h3>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 hover:text-rose-700 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-5">
        <label className="min-w-[240px] flex-1 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Endpoint Name</span>
          <input
            value={endpoint.endpointName}
            onChange={(event) => onChange({ ...endpoint, endpointName: event.target.value })}
            placeholder="Create User"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[140px] w-[180px] space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">HTTP Method</span>
          <select
            value={endpoint.method}
            onChange={(event) => onChange({ ...endpoint, method: event.target.value as HttpMethod })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5 group-hover:bg-white"
          >
            {METHOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[240px] flex-[2] space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Path Mapping</span>
          <input
            value={endpoint.path}
            onChange={(event) => onChange({ ...endpoint, path: event.target.value })}
            placeholder="/users/create"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 font-mono text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5 group-hover:bg-white"
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Method Annotations</h4>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <input
                type="checkbox"
                checked={endpoint.annotations.preAuthorizeEnabled}
                onChange={(event) =>
                  onChange({
                    ...endpoint,
                    annotations: {
                      ...endpoint.annotations,
                      preAuthorizeEnabled: event.target.checked
                    }
                  })
                }
              />
              @PreAuthorize
            </span>
            <input
              value={endpoint.annotations.preAuthorizeExpression}
              onChange={(event) =>
                onChange({
                  ...endpoint,
                  annotations: {
                    ...endpoint.annotations,
                    preAuthorizeExpression: event.target.value
                  }
                })
              }
              placeholder="isAuthenticated()"
              disabled={!endpoint.annotations.preAuthorizeEnabled}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <input
                type="checkbox"
                checked={endpoint.annotations.loggableEnabled}
                onChange={(event) =>
                  onChange({
                    ...endpoint,
                    annotations: {
                      ...endpoint.annotations,
                      loggableEnabled: event.target.checked
                    }
                  })
                }
              />
              @Loggable
            </span>
            <input
              value={endpoint.annotations.loggableAction}
              onChange={(event) =>
                onChange({
                  ...endpoint,
                  annotations: {
                    ...endpoint.annotations,
                    loggableAction: event.target.value
                  }
                })
              }
              placeholder="READ-CREATE-SCREEN-KRI"
              disabled={!endpoint.annotations.loggableEnabled}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <input
                type="checkbox"
                checked={endpoint.annotations.jsonViewEnabled}
                onChange={(event) =>
                  onChange({
                    ...endpoint,
                    annotations: {
                      ...endpoint.annotations,
                      jsonViewEnabled: event.target.checked
                    }
                  })
                }
              />
              @JsonView
            </span>
            <input
              value={endpoint.annotations.jsonViewClass}
              onChange={(event) =>
                onChange({
                  ...endpoint,
                  annotations: {
                    ...endpoint.annotations,
                    jsonViewClass: event.target.value
                  }
                })
              }
              placeholder="KRIViews.ViewScreen.class"
              disabled={!endpoint.annotations.jsonViewEnabled}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 space-y-4 animate-fade-in">
        <SchemaTable
          title="Request Body Builder"
          saveLabel="Save Request Schema"
          fields={endpoint.requestFields}
          onChange={(requestFields) => onChange({ ...endpoint, requestFields })}
          onSave={() => onChange({ ...endpoint, requestSavedAt: Date.now() })}
          onClear={() =>
            onChange({
              ...endpoint,
              requestFields: [createField()],
              requestSavedAt: undefined
            })
          }
          savedAt={endpoint.requestSavedAt}
        />

        <SchemaTable
          title="Response Body Builder"
          saveLabel="Save Response Schema"
          fields={endpoint.responseFields}
          onChange={(responseFields) => onChange({ ...endpoint, responseFields })}
          onSave={() => onChange({ ...endpoint, responseSavedAt: Date.now() })}
          onClear={() =>
            onChange({
              ...endpoint,
              responseFields: [createField()],
              responseSavedAt: undefined
            })
          }
          savedAt={endpoint.responseSavedAt}
        />
      </div>
    </article>
  );
}
