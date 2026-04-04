import { Minus, Plus } from "lucide-react";

import { PrimitiveSchemaType, SchemaField } from "@/lib/types";

const TYPE_OPTIONS: PrimitiveSchemaType[] = ["string", "integer", "number", "boolean", "object"];

interface SchemaTableProps {
  title: string;
  saveLabel: string;
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  onSave: () => void;
  onClear: () => void;
  savedAt?: number;
}

const createField = (): SchemaField => ({
  id: crypto.randomUUID(),
  fieldName: "",
  type: "string",
  isArray: false,
  sampleValue: ""
});

export function SchemaTable({ title, saveLabel, fields, onChange, onSave, onClear, savedAt }: SchemaTableProps) {
  const updateField = (id: string, key: keyof Omit<SchemaField, "id">, value: string | boolean) => {
    onChange(fields.map((field) => (field.id === id ? { ...field, [key]: value } : field)));
  };

  const addRow = (index?: number) => {
    const next = [...fields];
    const at = typeof index === "number" ? index + 1 : next.length;
    next.splice(at, 0, createField());
    onChange(next);
  };

  const removeRow = (id: string) => {
    const next = fields.filter((field) => field.id !== id);
    onChange(next.length ? next : [createField()]);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-slate-50/80">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        {savedAt ? (
          <span className="text-xs text-emerald-700">Saved {new Date(savedAt).toLocaleTimeString()}</span>
        ) : (
          <span className="text-xs text-slate-500">Not saved</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Field Name</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Array</th>
              <th className="px-3 py-2">Sample Value</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="animate-fade-in border-t border-slate-100 transition">
                <td className="px-3 py-2">
                  <input
                    value={field.fieldName}
                    onChange={(event) => updateField(field.id, "fieldName", event.target.value)}
                    placeholder="email"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5 group-hover:border-slate-300"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={field.type}
                    onChange={(event) => updateField(field.id, "type", event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition-all focus:border-slate-500 focus:ring-4 focus:ring-slate-500/5 group-hover:border-slate-300"
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-center">
                  <label className="inline-flex cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={field.isArray}
                      onChange={(event) => updateField(field.id, "isArray", event.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-slate-900 transition-all focus:ring-slate-500 focus:ring-offset-0"
                    />
                  </label>
                </td>
                <td className="px-3 py-2">
                  <input
                    value={field.sampleValue}
                    onChange={(event) => updateField(field.id, "sampleValue", event.target.value)}
                    placeholder={field.isArray ? "[], [1,2], [{\"id\":1}]" : field.type === "object" ? "{\"id\":1}" : "john@example.com"}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5 group-hover:border-slate-300"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => addRow(index)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:bg-slate-100"
                      aria-label="Add row"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(field.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                      aria-label="Delete row"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold tracking-tight text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10 active:scale-[0.98]"
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold tracking-tight text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
