"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  CopyPlus,
  Download,
  FileCode2,
  FolderPlus,
  Github,
  History,
  Lightbulb,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  UserCircle2,
  UploadCloud
} from "lucide-react";

import { EndpointCard } from "@/components/EndpointCard";
import { ApiGeneratorPage } from "@/components/ApiGeneratorPage";
import { ProjectSetupCard } from "@/components/ProjectSetupCard";
import { generateJavaArtifacts } from "@/lib/codegen";
import { createOpenApiDocument } from "@/lib/openapi";
import { EndpointAnnotations, EndpointContract, ProjectSetup, SchemaField } from "@/lib/types";

const HISTORY_STORAGE_KEY = "api-contract-builder.publish-history.v1";
const AUTH_STORAGE_KEY = "api-contract-builder.auth.v1";
const NOTIFICATION_CONFIG_STORAGE_KEY = "api-contract-builder.notifications.config.v1";
const NOTIFICATION_ITEMS_STORAGE_KEY = "api-contract-builder.notifications.items.v1";

type AuthProvider = "google" | "github";

interface AuthUser {
  id: string;
  mode: "login" | "register";
  provider: AuthProvider;
  name: string;
  email: string;
  createdAt: string;
}

interface NotificationConfig {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  recipientEmails: string;
  excludedEmails: string;
  scheduleEnabled: boolean;
  scheduleDays: string[];
  scheduleHour: number;
  scheduleMinute: number;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
}

interface NotificationItem {
  id: string;
  type: "project" | "field" | "publish" | "email" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface PublishHistoryEntry {
  id: string;
  fileName: string;
  version: string;
  tag: string;
  publishedAt: string;
  owner: string;
  repo: string;
  releaseUrl?: string;
  assetUrl?: string;
  snapshot: {
    setup: ProjectSetup;
    endpoints: EndpointContract[];
    yaml: string;
    github: {
      owner: string;
      repo: string;
      tag: string;
      assetName: string;
    };
  };
}

const SAMPLE_HISTORY_ENTRIES: PublishHistoryEntry[] = [
  {
    id: "hist-001",
    fileName: "ohb-kri-createKRIScreen-openapi.yaml",
    version: "1.0.2",
    tag: "v1.0.2",
    publishedAt: "2026-04-01T10:15:30.000Z",
    owner: "Bahwan-Cybertek-Private-Limited",
    repo: "GRC-OHB-Microservices-MSSQL",
    releaseUrl:
      "https://github.com/Bahwan-Cybertek-Private-Limited/GRC-OHB-Microservices-MSSQL/releases/tag/v1.0.2",
    assetUrl:
      "https://github.com/Bahwan-Cybertek-Private-Limited/GRC-OHB-Microservices-MSSQL/releases/download/v1.0.2/ohb-kri-createKRIScreen-openapi.yaml",
    snapshot: {
      setup: {
        projectName: "OHB KRI Create Screen",
        moduleName: "Create KRI - Screen",
        apiVersion: "1.0.2",
        basePackage: "com.asymmetrix.grc.riskkri",
        baseRequestPath: "/kri/createscreen",
        controllerName: "CreateKRIScreenController",
        serviceName: "CreateKRIScreenService"
      },
      endpoints: [
        {
          id: "ep-1",
          endpointName: "Get All KRIs",
          method: "POST",
          path: "/find/all",
          annotations: {
            preAuthorizeEnabled: true,
            preAuthorizeExpression: "isAuthenticated()",
            loggableEnabled: true,
            loggableAction: "READ-CREATE-SCREEN-KRI",
            jsonViewEnabled: true,
            jsonViewClass: "KRIViews.ViewScreen.class"
          },
          requestFields: [],
          responseFields: [
            {
              id: "rf-1",
              fieldName: "status",
              type: "string",
              isArray: false,
              sampleValue: "success"
            },
            {
              id: "rf-2",
              fieldName: "result",
              type: "object",
              isArray: true,
              sampleValue: "[{\"kriId\":25,\"kriUniqueId\":\"OHB/KRI/0025\",\"kriName\":\"Credit Risk Indicator\"}]"
            }
          ]
        },
        {
          id: "ep-2",
          endpointName: "Create KRI",
          method: "POST",
          path: "/new",
          annotations: {
            preAuthorizeEnabled: true,
            preAuthorizeExpression: "isAuthenticated()",
            loggableEnabled: true,
            loggableAction: "SAVE-OR-UPDATE-CREATE-SCREEN-KRI",
            jsonViewEnabled: true,
            jsonViewClass: "KRIViews.CreateScreen.class"
          },
          requestFields: [
            {
              id: "rq-1",
              fieldName: "kriName",
              type: "string",
              isArray: false,
              sampleValue: "Operational Risk Indicator"
            }
          ],
          responseFields: [
            {
              id: "rs-1",
              fieldName: "result",
              type: "object",
              isArray: false,
              sampleValue: "{\"kriId\":27,\"kriUniqueId\":\"OHB/KRI/0027\"}"
            }
          ]
        }
      ],
      yaml:
        "openapi: 3.0.0\ninfo:\n  title: OHB KRI Create Screen\n  version: 1.0.2\npaths:\n  /find/all:\n    post:\n      summary: Get All KRIs\n  /new:\n    post:\n      summary: Create KRI\n",
      github: {
        owner: "Bahwan-Cybertek-Private-Limited",
        repo: "GRC-OHB-Microservices-MSSQL",
        tag: "v1.0.2",
        assetName: "ohb-kri-createKRIScreen-openapi.yaml"
      }
    }
  }
];

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  inAppEnabled: true,
  emailEnabled: false,
  recipientEmails: "",
  excludedEmails: "",
  scheduleEnabled: false,
  scheduleDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  scheduleHour: 9,
  scheduleMinute: 0,
  reminderEnabled: false,
  reminderMinutesBefore: 30
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const defaultAnnotations = (): EndpointAnnotations => ({
  preAuthorizeEnabled: false,
  preAuthorizeExpression: "isAuthenticated()",
  loggableEnabled: false,
  loggableAction: "READ-ACTION",
  jsonViewEnabled: false,
  jsonViewClass: "KRIViews.ViewScreen.class"
});

const createField = (): SchemaField => ({
  id: crypto.randomUUID(),
  fieldName: "",
  type: "string",
  isArray: false,
  sampleValue: ""
});

const normalizeField = (field: Partial<SchemaField>): SchemaField => ({
  id: field.id || crypto.randomUUID(),
  fieldName: field.fieldName || "",
  type: field.type || "string",
  isArray: field.isArray ?? false,
  sampleValue: field.sampleValue || ""
});

const normalizeEndpoint = (endpoint: Partial<EndpointContract>, index: number): EndpointContract => ({
  id: endpoint.id || crypto.randomUUID(),
  endpointName: endpoint.endpointName || `Endpoint ${index + 1}`,
  method: endpoint.method || "POST",
  path: endpoint.path || `/endpoint-${index + 1}`,
  annotations: {
    ...defaultAnnotations(),
    ...(endpoint.annotations || {})
  },
  requestFields:
    endpoint.requestFields && endpoint.requestFields.length
      ? endpoint.requestFields.map((field) => normalizeField(field))
      : [createField()],
  responseFields:
    endpoint.responseFields && endpoint.responseFields.length
      ? endpoint.responseFields.map((field) => normalizeField(field))
      : [createField()],
  requestSavedAt: endpoint.requestSavedAt,
  responseSavedAt: endpoint.responseSavedAt
});

const createEndpoint = (index: number): EndpointContract => ({
  id: crypto.randomUUID(),
  endpointName: `Endpoint ${index + 1}`,
  method: "POST",
  path: `/endpoint-${index + 1}`,
  annotations: defaultAnnotations(),
  requestFields: [createField()],
  responseFields: [createField()]
});

const bumpPatchVersion = (version: string) => {
  const clean = (version || "1.0.0").replace(/^v/i, "");
  const [majorRaw, minorRaw, patchRaw] = clean.split(".");
  const major = Number.parseInt(majorRaw || "1", 10);
  const minor = Number.parseInt(minorRaw || "0", 10);
  const patch = Number.parseInt(patchRaw || "0", 10);

  const safeMajor = Number.isNaN(major) ? 1 : major;
  const safeMinor = Number.isNaN(minor) ? 0 : minor;
  const safePatch = Number.isNaN(patch) ? 0 : patch;

  return `${safeMajor}.${safeMinor}.${safePatch + 1}`;
};

const previewLineClass = (line: string) => {
  if (line.startsWith("openapi") || line.startsWith("info") || line.startsWith("paths")) {
    return "text-sky-300";
  }

  if (line.trim().startsWith("type:") || line.trim().startsWith("example:")) {
    return "text-emerald-300";
  }

  if (line.includes("application/json")) {
    return "text-violet-300";
  }

  if (line.trim().startsWith("summary:") || line.trim().startsWith("description:")) {
    return "text-amber-300";
  }

  return "text-slate-200";
};

export default function HomePage() {
  const [setup, setSetup] = useState<ProjectSetup>({
    projectName: "",
    moduleName: "",
    apiVersion: "1.0.0",
    basePackage: "com.example.contract",
    baseRequestPath: "/api",
    controllerName: "",
    serviceName: ""
  });
  const initialEndpoint = createEndpoint(0);
  const [endpoints, setEndpoints] = useState<EndpointContract[]>([initialEndpoint]);
  const [activeEndpointId, setActiveEndpointId] = useState<string>(initialEndpoint.id);

  const [viewMode, setViewMode] = useState<"builder" | "apiGenerator" | "history" | "notifications">("builder");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadedHistoryId, setLoadedHistoryId] = useState<string | null>(null);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneSetup, setCloneSetup] = useState({
    projectName: "",
    moduleName: "",
    apiVersion: ""
  });

  const [historyEntries, setHistoryEntries] = useState<PublishHistoryEntry[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");

  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [codeCopyStatus, setCodeCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [zipStatus, setZipStatus] = useState<"idle" | "ready" | "error">("idle");
  const [codeTab, setCodeTab] = useState<"controller" | "dto">("controller");
  const [activeDtoIndex, setActiveDtoIndex] = useState(0);

  const [githubConfig, setGithubConfig] = useState({
    owner: "Bahwan-Cybertek-Private-Limited",
    repo: "GRC-OHB-Microservices-MSSQL",
    tag: "v1.0.0",
    assetName: "openapi.yaml",
    token: ""
  });
  const [githubStatus, setGithubStatus] = useState<{
    state: "idle" | "publishing" | "success" | "error";
    message?: string;
    url?: string;
  }>({ state: "idle" });
  const previousSnapshotRef = useRef<{ projectName: string; endpointCount: number; totalFieldCount: number } | null>(null);

  const { yaml } = useMemo(() => {
    return createOpenApiDocument(setup.projectName, setup.moduleName, setup.apiVersion, endpoints);
  }, [setup.projectName, setup.moduleName, setup.apiVersion, endpoints]);

  const javaArtifacts = useMemo(() => generateJavaArtifacts(setup, endpoints), [setup, endpoints]);

  const activeEndpoint = endpoints.find((endpoint) => endpoint.id === activeEndpointId) ?? endpoints[0];
  const activeDtoFile = javaArtifacts.dtoFiles[activeDtoIndex];
  const selectedHistoryEntry = historyEntries.find((entry) => entry.id === selectedHistoryId) || null;

  const pushNotification = (type: NotificationItem["type"], title: string, message: string) => {
    const item: NotificationItem = {
      id: crypto.randomUUID(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    if (notificationConfig.inAppEnabled) {
      setNotificationItems((prev) => [item, ...prev].slice(0, 200));
    }
  };

  const unreadCount = notificationItems.filter((item) => !item.read).length;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const authRaw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (authRaw) {
        setAuthUser(JSON.parse(authRaw) as AuthUser);
      }
    } catch {
      // ignore
    }

    try {
      const configRaw = window.localStorage.getItem(NOTIFICATION_CONFIG_STORAGE_KEY);
      if (configRaw) {
        setNotificationConfig({ ...DEFAULT_NOTIFICATION_CONFIG, ...(JSON.parse(configRaw) as NotificationConfig) });
      }
    } catch {
      // ignore
    }

    try {
      const itemsRaw = window.localStorage.getItem(NOTIFICATION_ITEMS_STORAGE_KEY);
      if (itemsRaw) {
        const parsed = JSON.parse(itemsRaw) as NotificationItem[];
        if (Array.isArray(parsed)) {
          setNotificationItems(parsed);
        }
      }
    } catch {
      // ignore
    }

    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PublishHistoryEntry[];
      if (!Array.isArray(parsed)) {
        return;
      }

      const normalized = parsed.map((entry) => ({
        ...entry,
        snapshot: {
          ...entry.snapshot,
          endpoints: (entry.snapshot.endpoints || []).map((ep, index) => normalizeEndpoint(ep, index))
        }
      }));

      setHistoryEntries(normalized);
      setSelectedHistoryId(normalized[0]?.id || null);
    } catch {
      // Ignore corrupted local history state and start clean.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (authUser) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [authUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(NOTIFICATION_CONFIG_STORAGE_KEY, JSON.stringify(notificationConfig));
  }, [notificationConfig]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(NOTIFICATION_ITEMS_STORAGE_KEY, JSON.stringify(notificationItems));
  }, [notificationItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyEntries));
  }, [historyEntries]);

  useEffect(() => {
    if (activeDtoIndex > javaArtifacts.dtoFiles.length - 1) {
      setActiveDtoIndex(0);
    }
  }, [activeDtoIndex, javaArtifacts.dtoFiles.length]);

  useEffect(() => {
    setGithubConfig((prev) => {
      if (!prev.tag || prev.tag === "v1.0.0" || prev.tag === `v${setup.apiVersion}`) {
        return { ...prev, tag: `v${setup.apiVersion || "1.0.0"}` };
      }
      return prev;
    });
  }, [setup.apiVersion]);

  useEffect(() => {
    const totalFieldCount = endpoints.reduce(
      (acc, endpoint) => acc + endpoint.requestFields.length + endpoint.responseFields.length,
      0
    );
    const snapshot = {
      projectName: setup.projectName.trim(),
      endpointCount: endpoints.length,
      totalFieldCount
    };

    const previous = previousSnapshotRef.current;
    if (!previous) {
      previousSnapshotRef.current = snapshot;
      return;
    }

    if (snapshot.projectName && snapshot.projectName !== previous.projectName) {
      pushNotification("project", "Project updated", `Project name changed to ${snapshot.projectName}.`);
    }

    if (snapshot.endpointCount > previous.endpointCount) {
      pushNotification("project", "Endpoint added", `New endpoint added. Total endpoints: ${snapshot.endpointCount}.`);
    }

    if (snapshot.totalFieldCount > previous.totalFieldCount) {
      pushNotification("field", "Field added", `Schema fields increased to ${snapshot.totalFieldCount}.`);
    }

    previousSnapshotRef.current = snapshot;
  }, [endpoints, setup.projectName]);

  const updateEndpoint = (id: string, next: EndpointContract) => {
    setEndpoints((prev) => prev.map((endpoint) => (endpoint.id === id ? next : endpoint)));
  };

  const addEndpoint = () => {
    setEndpoints((prev) => {
      const nextEndpoint = createEndpoint(prev.length);
      setActiveEndpointId(nextEndpoint.id);
      return [...prev, nextEndpoint];
    });
  };

  const deleteEndpoint = (id: string) => {
    setEndpoints((prev) => {
      const next = prev.filter((endpoint) => endpoint.id !== id);
      if (!next.length) {
        const fallback = createEndpoint(0);
        setActiveEndpointId(fallback.id);
        return [fallback];
      }

      if (activeEndpointId === id) {
        setActiveEndpointId(next[0].id);
      }

      return next;
    });
  };

  const authenticateWithProvider = (provider: AuthProvider) => {
    const normalizedEmail = authEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      return;
    }

    const nameFromEmail = normalizedEmail.split("@")[0] || "developer";
    const user: AuthUser = {
      id: crypto.randomUUID(),
      mode: authMode,
      provider,
      name: (authName.trim() || nameFromEmail).replace(/\./g, " "),
      email: normalizedEmail,
      createdAt: new Date().toISOString()
    };
    setAuthUser(user);
    pushNotification("system", "Signed in", `${user.email} signed in via ${provider}.`);
  };

  const logout = () => {
    if (!authUser) {
      return;
    }
    pushNotification("system", "Signed out", `${authUser.email} signed out.`);
    setAuthUser(null);
  };

  const openCloneDialog = () => {
    setCloneSetup({
      projectName: `${setup.projectName || "Project"} Clone`,
      moduleName: setup.moduleName || "",
      apiVersion: bumpPatchVersion(setup.apiVersion || "1.0.0")
    });
    setCloneDialogOpen(true);
  };

  const cloneCurrentProject = () => {
    setSetup((prev) => ({
      ...prev,
      projectName: cloneSetup.projectName.trim() || `${prev.projectName} Clone`,
      moduleName: cloneSetup.moduleName.trim() || prev.moduleName,
      apiVersion: cloneSetup.apiVersion.trim() || bumpPatchVersion(prev.apiVersion || "1.0.0")
    }));
    setLoadedHistoryId(null);
    setGithubConfig((prev) => ({
      ...prev,
      tag: `v${cloneSetup.apiVersion.trim() || bumpPatchVersion(setup.apiVersion || "1.0.0")}`
    }));
    setCloneDialogOpen(false);
    pushNotification("project", "Project cloned", `Cloned into ${cloneSetup.projectName || "new project"}.`);
  };

  const markAllNotificationsRead = () => {
    setNotificationItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const clearNotifications = () => {
    setNotificationItems([]);
  };

  const copyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1400);
    } catch {
      setCopyStatus("error");
      setTimeout(() => setCopyStatus("idle"), 1800);
    }
  };

  const downloadTextFile = (fileName: string, content: string) => {
    const file = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const copyCode = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCodeCopyStatus("copied");
      setTimeout(() => setCodeCopyStatus("idle"), 1400);
    } catch {
      setCodeCopyStatus("error");
      setTimeout(() => setCodeCopyStatus("idle"), 1800);
    }
  };

  const generateAndDownloadYaml = () => {
    const file = new Blob([yaml], { type: "application/yaml;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");

    const fileNameBase = setup.projectName.trim() || "api-contract";

    anchor.href = url;
    anchor.download = `${fileNameBase.toLowerCase().replace(/\s+/g, "-")}.yaml`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const downloadAllJavaAsZip = async () => {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file(javaArtifacts.controllerFile.fileName, javaArtifacts.controllerFile.content);
      javaArtifacts.dtoFiles.forEach((dto) => zip.file(dto.fileName, dto.content));

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${(setup.moduleName || "generated-contract").toLowerCase().replace(/\s+/g, "-")}-java.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setZipStatus("ready");
      setTimeout(() => setZipStatus("idle"), 1400);
    } catch {
      setZipStatus("error");
      setTimeout(() => setZipStatus("idle"), 1800);
    }
  };

  const loadSnapshotIntoEditor = (entry: PublishHistoryEntry, options?: { bumpVersion?: boolean }) => {
    const nextSetup = clone(entry.snapshot.setup);
    const nextEndpoints = entry.snapshot.endpoints.map((ep, index) => normalizeEndpoint(ep, index));

    if (options?.bumpVersion) {
      nextSetup.apiVersion = bumpPatchVersion(nextSetup.apiVersion || setup.apiVersion);
      setGithubConfig((prev) => ({ ...prev, tag: `v${nextSetup.apiVersion}` }));
    }

    setSetup(nextSetup);
    setEndpoints(nextEndpoints.length ? nextEndpoints : [createEndpoint(0)]);
    setActiveEndpointId(nextEndpoints[0]?.id || createEndpoint(0).id);
    setGithubConfig((prev) => ({
      ...prev,
      owner: entry.snapshot.github.owner,
      repo: entry.snapshot.github.repo,
      tag: options?.bumpVersion ? `v${nextSetup.apiVersion}` : entry.snapshot.github.tag,
      assetName: entry.snapshot.github.assetName
    }));
    setLoadedHistoryId(entry.id);
    setViewMode("builder");
  };

  const publishYamlToGitHubRelease = async () => {
    if (!githubConfig.owner || !githubConfig.repo || !githubConfig.tag || !githubConfig.assetName || !githubConfig.token) {
      setGithubStatus({ state: "error", message: "Owner, repo, tag, asset name, and token are required." });
      return;
    }

    setGithubStatus({ state: "publishing", message: "Publishing YAML to GitHub Release..." });

    const baseRepoUrl = `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}`;
    const commonHeaders = {
      Authorization: `Bearer ${githubConfig.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };

    try {
      let releaseId: number | null = null;
      let releaseHtmlUrl = "";

      const getReleaseResponse = await fetch(`${baseRepoUrl}/releases/tags/${encodeURIComponent(githubConfig.tag)}`, {
        method: "GET",
        headers: commonHeaders
      });

      if (getReleaseResponse.ok) {
        const releaseData = await getReleaseResponse.json();
        releaseId = releaseData.id as number;
        releaseHtmlUrl = releaseData.html_url as string;

        const existingAsset = (releaseData.assets as Array<{ id: number; name: string }>).find(
          (asset) => asset.name === githubConfig.assetName
        );

        if (existingAsset) {
          await fetch(`${baseRepoUrl}/releases/assets/${existingAsset.id}`, {
            method: "DELETE",
            headers: commonHeaders
          });
        }
      } else if (getReleaseResponse.status === 404) {
        const createReleaseResponse = await fetch(`${baseRepoUrl}/releases`, {
          method: "POST",
          headers: {
            ...commonHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            tag_name: githubConfig.tag,
            name: `OpenAPI ${githubConfig.tag}`,
            generate_release_notes: false,
            prerelease: false
          })
        });

        if (!createReleaseResponse.ok) {
          const details = await createReleaseResponse.text();
          throw new Error(`Failed to create release: ${details}`);
        }

        const created = await createReleaseResponse.json();
        releaseId = created.id as number;
        releaseHtmlUrl = created.html_url as string;
      } else {
        const details = await getReleaseResponse.text();
        throw new Error(`Failed to get release: ${details}`);
      }

      if (!releaseId) {
        throw new Error("Could not resolve target release.");
      }

      const uploadUrl = `https://uploads.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/releases/${releaseId}/assets?name=${encodeURIComponent(githubConfig.assetName)}`;
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          ...commonHeaders,
          "Content-Type": "application/yaml"
        },
        body: yaml
      });

      if (!uploadResponse.ok) {
        const details = await uploadResponse.text();
        throw new Error(`Failed to upload YAML: ${details}`);
      }

      const uploadedAsset = await uploadResponse.json();
      const now = new Date().toISOString();
      const historyEntry: PublishHistoryEntry = {
        id: crypto.randomUUID(),
        fileName: githubConfig.assetName,
        version: setup.apiVersion,
        tag: githubConfig.tag,
        publishedAt: now,
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        releaseUrl: releaseHtmlUrl,
        assetUrl: uploadedAsset.browser_download_url as string,
        snapshot: {
          setup: clone(setup),
          endpoints: clone(endpoints),
          yaml,
          github: {
            owner: githubConfig.owner,
            repo: githubConfig.repo,
            tag: githubConfig.tag,
            assetName: githubConfig.assetName
          }
        }
      };

      setHistoryEntries((prev) => [historyEntry, ...prev]);
      setSelectedHistoryId(historyEntry.id);
      setGithubStatus({
        state: "success",
        message: "YAML published successfully to GitHub Release.",
        url: (uploadedAsset.browser_download_url as string) || releaseHtmlUrl
      });
      setLoadedHistoryId(historyEntry.id);
      pushNotification(
        "publish",
        "YAML published",
        `${githubConfig.assetName} (${setup.apiVersion}) published to ${githubConfig.owner}/${githubConfig.repo} ${githubConfig.tag}.`
      );

      if (notificationConfig.emailEnabled) {
        const schedulePart = notificationConfig.scheduleEnabled
          ? `Scheduled on ${notificationConfig.scheduleDays.join(", ")} at ${String(notificationConfig.scheduleHour).padStart(2, "0")}:${String(notificationConfig.scheduleMinute).padStart(2, "0")}`
          : "Immediate email mode enabled";
        pushNotification(
          "email",
          "Email notification queued",
          `${schedulePart}. Excluding: ${notificationConfig.excludedEmails || "none"}.`
        );
      }
    } catch (error) {
      setGithubStatus({
        state: "error",
        message: error instanceof Error ? error.message : "Failed to publish YAML."
      });
    }
  };

  const loadSampleHistoryData = () => {
    const normalized = SAMPLE_HISTORY_ENTRIES.map((entry) => ({
      ...clone(entry),
      snapshot: {
        ...clone(entry.snapshot),
        endpoints: (entry.snapshot.endpoints || []).map((ep, index) => normalizeEndpoint(ep, index))
      }
    }));

    setHistoryEntries(normalized);
    setSelectedHistoryId(normalized[0]?.id || null);
    setViewMode("history");
  };

  const builderContent = (
    <>
      <header className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-card backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Contract Kit</h1>
            <p className="mt-1 text-sm text-slate-600">
              Build endpoint contracts, shape request/response schemas, generate Java artifacts, and publish YAML to GitHub Releases.
            </p>
          </div>
          <button
            type="button"
            onClick={openCloneDialog}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <CopyPlus className="h-4 w-4" />
            Clone Project
          </button>
        </div>
        {loadedHistoryId ? (
          <p className="mt-2 text-xs font-medium text-emerald-700">Loaded from history entry: {loadedHistoryId}</p>
        ) : null}
      </header>

      <ProjectSetupCard value={setup} onChange={setSetup} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">API Endpoint Builder</h2>
          <button
            type="button"
            onClick={addEndpoint}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Endpoint
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
          {endpoints.map((endpoint, index) => {
            const isActive = endpoint.id === activeEndpoint.id;
            const tabLabel = endpoint.endpointName.trim() || `Endpoint ${index + 1}`;
            return (
              <button
                key={endpoint.id}
                type="button"
                onClick={() => setActiveEndpointId(endpoint.id)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all active:scale-[0.98] ${
                  isActive ? "bg-slate-900 text-white shadow-md shadow-slate-900/10" : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          <EndpointCard
            key={activeEndpoint.id}
            endpoint={activeEndpoint}
            onChange={(next) => updateEndpoint(activeEndpoint.id, next)}
            onDelete={() => deleteEndpoint(activeEndpoint.id)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-card sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-white sm:text-lg">YAML Preview</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyYaml}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              {copyStatus === "copied" ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              {copyStatus === "copied" ? "Copied" : copyStatus === "error" ? "Copy Failed" : "Copy YAML"}
            </button>
            <button
              type="button"
              onClick={generateAndDownloadYaml}
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400"
            >
              <Download className="h-4 w-4" />
              Generate YAML
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-sm leading-6">
          {yaml.split("\n").map((line, index) => (
            <div key={`${line}-${index}`} className={previewLineClass(line)}>
              {line || " "}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Publish YAML To GitHub Release</h2>
          <a
            href="https://github.com/settings/tokens?type=beta"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Github className="h-4 w-4" />
            Create PAT
          </a>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</span>
            <input
              value={githubConfig.owner}
              onChange={(event) => setGithubConfig((prev) => ({ ...prev, owner: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repository</span>
            <input
              value={githubConfig.repo}
              onChange={(event) => setGithubConfig((prev) => ({ ...prev, repo: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release Tag</span>
            <input
              value={githubConfig.tag}
              onChange={(event) => setGithubConfig((prev) => ({ ...prev, tag: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Asset Name</span>
            <input
              value={githubConfig.assetName}
              onChange={(event) => setGithubConfig((prev) => ({ ...prev, assetName: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">GitHub Token (PAT)</span>
            <input
              type="password"
              value={githubConfig.token}
              onChange={(event) => setGithubConfig((prev) => ({ ...prev, token: event.target.value }))}
              placeholder="Fine-grained token with Contents: Read and write"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={publishYamlToGitHubRelease}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            <UploadCloud className="h-4 w-4" />
            {githubStatus.state === "publishing" ? "Publishing..." : "Publish YAML To Release"}
          </button>
          <p className="text-xs text-slate-500">Token is used only from your browser and not persisted.</p>
        </div>

        {githubStatus.message ? (
          <p className={`mt-3 text-sm ${githubStatus.state === "success" ? "text-emerald-700" : "text-rose-700"}`}>
            {githubStatus.message}{" "}
            {githubStatus.url ? (
              <a href={githubStatus.url} target="_blank" rel="noreferrer" className="underline">
                Open
              </a>
            ) : null}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-card sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white sm:text-lg">Java Code Generation</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyCode(codeTab === "controller" ? javaArtifacts.controllerFile.content : activeDtoFile?.content || "")}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              {codeCopyStatus === "copied" ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              {codeCopyStatus === "copied" ? "Copied" : codeCopyStatus === "error" ? "Copy Failed" : "Copy Code"}
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  codeTab === "controller" ? javaArtifacts.controllerFile.fileName : activeDtoFile?.fileName || "GeneratedDTO.java",
                  codeTab === "controller" ? javaArtifacts.controllerFile.content : activeDtoFile?.content || ""
                )
              }
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400"
            >
              <Download className="h-4 w-4" />
              Download Code
            </button>
            <button
              type="button"
              onClick={downloadAllJavaAsZip}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              <Archive className="h-4 w-4" />
              {zipStatus === "ready" ? "ZIP Ready" : zipStatus === "error" ? "ZIP Failed" : "Download ZIP"}
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-2">
          <button
            type="button"
            onClick={() => setCodeTab("controller")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              codeTab === "controller" ? "bg-slate-100 text-slate-900" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
            }`}
          >
            <Code2 className="h-4 w-4" />
            Controller
          </button>
          <button
            type="button"
            onClick={() => setCodeTab("dto")}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              codeTab === "dto" ? "bg-slate-100 text-slate-900" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
            }`}
          >
            <FileCode2 className="h-4 w-4" />
            DTOs ({javaArtifacts.dtoFiles.length})
          </button>
        </div>

        {codeTab === "dto" ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {javaArtifacts.dtoFiles.map((dtoFile, index) => (
              <button
                key={dtoFile.fileName}
                type="button"
                onClick={() => setActiveDtoIndex(index)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  index === activeDtoIndex ? "bg-sky-200 text-slate-900" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
                }`}
              >
                {dtoFile.fileName}
              </button>
            ))}
          </div>
        ) : null}

        <div className="max-h-[460px] overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4 font-mono text-sm leading-6 text-slate-200">
          <pre className="whitespace-pre-wrap">
            {codeTab === "controller" ? javaArtifacts.controllerFile.content : activeDtoFile?.content || "No DTO generated."}
          </pre>
        </div>
      </section>
    </>
  );

  const historyContent = (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Publish History</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSampleHistoryData}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Load Sample Data
          </button>
          <span className="text-xs text-slate-500">Stored locally as JSON for now</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200">
          {historyEntries.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No published entries yet.</p>
          ) : (
            historyEntries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedHistoryId(entry.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                  selectedHistoryId === entry.id ? "bg-sky-50" : "hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{entry.fileName} - v{entry.version}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(entry.publishedAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {entry.owner}/{entry.repo} ({entry.tag})
                </p>
              </button>
            ))
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          {selectedHistoryEntry ? (
            <>
              <h3 className="text-base font-semibold text-slate-900">{selectedHistoryEntry.fileName}</h3>
              <p className="mt-1 text-sm text-slate-600">Version {selectedHistoryEntry.version}</p>
              <p className="text-xs text-slate-500">Published: {new Date(selectedHistoryEntry.publishedAt).toLocaleString()}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadSnapshotIntoEditor(selectedHistoryEntry)}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Edit This Version
                </button>
                <button
                  type="button"
                  onClick={() => loadSnapshotIntoEditor(selectedHistoryEntry, { bumpVersion: true })}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
                >
                  <RotateCcw className="h-4 w-4" />
                  Rollback (Load + Bump Version)
                </button>
                {selectedHistoryEntry.releaseUrl ? (
                  <a
                    href={selectedHistoryEntry.releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Open Release
                  </a>
                ) : null}
                {selectedHistoryEntry.assetUrl ? (
                  <a
                    href={selectedHistoryEntry.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Open Asset
                  </a>
                ) : null}
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snapshot Summary</p>
                <p className="mt-2 text-sm text-slate-700">Project: {selectedHistoryEntry.snapshot.setup.projectName || "-"}</p>
                <p className="text-sm text-slate-700">Module: {selectedHistoryEntry.snapshot.setup.moduleName || "-"}</p>
                <p className="text-sm text-slate-700">Endpoints: {selectedHistoryEntry.snapshot.endpoints.length}</p>
              </div>

              <div className="mt-4 max-h-[320px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200">
                <pre className="whitespace-pre-wrap">{selectedHistoryEntry.snapshot.yaml}</pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Select a history entry to inspect, edit, or rollback.</p>
          )}
        </div>
      </div>
    </section>
  );

  const notificationsContent = (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Notification Settings</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Mark All Read
          </button>
          <button
            type="button"
            onClick={clearNotifications}
            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <span className="font-medium text-slate-800">Enable In-App Notifications</span>
            <input
              type="checkbox"
              checked={notificationConfig.inAppEnabled}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  inAppEnabled: event.target.checked
                }))
              }
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <span className="font-medium text-slate-800">Enable Email Notifications</span>
            <input
              type="checkbox"
              checked={notificationConfig.emailEnabled}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  emailEnabled: event.target.checked
                }))
              }
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipient Emails (comma separated)</span>
            <textarea
              value={notificationConfig.recipientEmails}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  recipientEmails: event.target.value
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exclude Emails</span>
            <textarea
              value={notificationConfig.excludedEmails}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  excludedEmails: event.target.value
                }))
              }
              rows={2}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <span className="font-medium text-slate-800">Schedule Emails</span>
            <input
              type="checkbox"
              checked={notificationConfig.scheduleEnabled}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  scheduleEnabled: event.target.checked
                }))
              }
            />
          </label>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule Days</p>
            <div className="flex flex-wrap gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                const selected = notificationConfig.scheduleDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setNotificationConfig((prev) => ({
                        ...prev,
                        scheduleDays: selected
                          ? prev.scheduleDays.filter((item) => item !== day)
                          : [...prev.scheduleDays, day]
                      }))
                    }
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                      selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hour</span>
              <input
                type="number"
                min={0}
                max={23}
                value={notificationConfig.scheduleHour}
                onChange={(event) =>
                  setNotificationConfig((prev) => ({
                    ...prev,
                    scheduleHour: Number.parseInt(event.target.value || "0", 10)
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minute</span>
              <input
                type="number"
                min={0}
                max={59}
                value={notificationConfig.scheduleMinute}
                onChange={(event) =>
                  setNotificationConfig((prev) => ({
                    ...prev,
                    scheduleMinute: Number.parseInt(event.target.value || "0", 10)
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <span className="font-medium text-slate-800">Enable Reminder</span>
            <input
              type="checkbox"
              checked={notificationConfig.reminderEnabled}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  reminderEnabled: event.target.checked
                }))
              }
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reminder Minutes Before</span>
            <input
              type="number"
              min={0}
              max={1440}
              value={notificationConfig.reminderMinutesBefore}
              onChange={(event) =>
                setNotificationConfig((prev) => ({
                  ...prev,
                  reminderMinutesBefore: Number.parseInt(event.target.value || "0", 10)
                }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">In-App Feed ({notificationItems.length})</h3>
          <div className="max-h-[70vh] space-y-2 overflow-auto pr-1">
            {notificationItems.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notificationItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 ${item.read ? "border-slate-200 bg-white" : "border-sky-200 bg-sky-50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <span className="text-[11px] uppercase tracking-wide text-slate-500">{item.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{item.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );

  const apiGeneratorContent = (
    <ApiGeneratorPage onActivity={(message) => pushNotification("system", "Contract Kit", message)} />
  );

  if (!authUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#dbeafe_0,_#f4f7fb_35%,_#f4f7fb_100%)] p-4">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h1 className="text-xl font-bold text-slate-900">Welcome To Contract Kit</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in or register with Google/GitHub to continue.</p>

          <div className="mt-4 flex gap-2 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setAuthMode("login")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${
                authMode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("register")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold ${
                authMode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Register
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
              <input
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
                placeholder="Developer Name"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work Email</span>
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="your.name@company.com"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => authenticateWithProvider("google")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              <Mail className="h-4 w-4" />
              Continue With Google
            </button>
            <button
              type="button"
              onClick={() => authenticateWithProvider("github")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Github className="h-4 w-4" />
              Continue With GitHub
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Current implementation stores auth locally for UI flow. OAuth backend can be plugged in next.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe_0,_#f8fafc_35%,_#f8fafc_100%)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row lg:items-start">
        <aside
          className={`flex shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-card transition-all ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="space-y-2">
            <div className={`mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2 ${sidebarCollapsed ? "text-center" : ""}`}>
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-slate-600" />
                {sidebarCollapsed ? null : (
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{authUser.name}</p>
                    <p className="text-[11px] text-slate-500">{authUser.email}</p>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewMode("builder")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                viewMode === "builder" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <FolderPlus className="h-4 w-4" />
              {sidebarCollapsed ? null : "Create Project"}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("apiGenerator")}
              className={`mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                viewMode === "apiGenerator" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              {sidebarCollapsed ? null : "API Contract Builder"}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("history")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                viewMode === "history" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <History className="h-4 w-4" />
              {sidebarCollapsed ? null : `History (${historyEntries.length})`}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("notifications")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                viewMode === "notifications" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Bell className="h-4 w-4" />
              {sidebarCollapsed ? null : `Notifications (${unreadCount})`}
            </button>
          </div>

          <div className="space-y-3">
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 p-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-rose-600 active:scale-[0.98]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </aside>

        <div className="flex-1 space-y-5">
          {viewMode === "builder"
            ? builderContent
            : viewMode === "apiGenerator"
              ? apiGeneratorContent
              : viewMode === "history"
                ? historyContent
                : notificationsContent}
        </div>
      </div>

      {cloneDialogOpen ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-lg font-semibold text-slate-900">Clone Project</h3>
            <p className="mt-1 text-sm text-slate-600">
              Clone the current project with a new name/version, then modify and publish it.
            </p>
            <div className="mt-4 grid gap-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Name</span>
                <input
                  value={cloneSetup.projectName}
                  onChange={(event) => setCloneSetup((prev) => ({ ...prev, projectName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Module Name</span>
                <input
                  value={cloneSetup.moduleName}
                  onChange={(event) => setCloneSetup((prev) => ({ ...prev, moduleName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</span>
                <input
                  value={cloneSetup.apiVersion}
                  onChange={(event) => setCloneSetup((prev) => ({ ...prev, apiVersion: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloneDialogOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={cloneCurrentProject}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
