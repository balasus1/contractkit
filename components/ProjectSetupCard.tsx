import { ProjectSetup } from "@/lib/types";

interface ProjectSetupCardProps {
  value: ProjectSetup;
  onChange: (next: ProjectSetup) => void;
}

export function ProjectSetupCard({ value, onChange }: ProjectSetupCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:shadow-lg sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 sm:text-base">Project Configuration</h2>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">Project Scope</span>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-5">
        <label className="min-w-[240px] flex-1 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Project Name</span>
          <input
            value={value.projectName}
            onChange={(event) => onChange({ ...value, projectName: event.target.value })}
            placeholder="Payment Platform"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[240px] flex-1 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Module Name</span>
          <input
            value={value.moduleName}
            onChange={(event) => onChange({ ...value, moduleName: event.target.value })}
            placeholder="User Management"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[120px] w-[180px] space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">API Version</span>
          <input
            value={value.apiVersion}
            onChange={(event) => onChange({ ...value, apiVersion: event.target.value })}
            placeholder="1.0.3"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[280px] flex-grow-[2] space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Base Package</span>
          <input
            value={value.basePackage}
            onChange={(event) => onChange({ ...value, basePackage: event.target.value })}
            placeholder="com.example.app"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[240px] flex-1 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Base Mapping</span>
          <input
            value={value.baseRequestPath}
            onChange={(event) => onChange({ ...value, baseRequestPath: event.target.value })}
            placeholder="/api/v1"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[240px] flex-1 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Controller Name</span>
          <input
            value={value.controllerName}
            onChange={(event) => onChange({ ...value, controllerName: event.target.value })}
            placeholder="MainController"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>

        <label className="min-w-[240px] flex-1 space-y-2">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-tight">Service Name</span>
          <input
            value={value.serviceName}
            onChange={(event) => onChange({ ...value, serviceName: event.target.value })}
            placeholder="MainService"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-500/5"
          />
        </label>
      </div>
    </section>
  );
}
