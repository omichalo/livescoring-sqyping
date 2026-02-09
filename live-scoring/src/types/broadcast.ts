// SlotId is a flexible string type, not hardcoded union
// Examples may use "A", "B", "C", "D" but any string is valid
export type SlotId = string;

export interface SlotMapping {
  slotId: SlotId; // string type - configured per session (examples: "A", "B", "C", "D")
  physicalTable: number;
  cameraKitId?: string;
  obsInstanceId?: string;
  isActive: boolean;
}

export interface BroadcastSession {
  id: string;
  venueId: string;
  venueName: string;
  date: string; // ISO date "2024-01-15"
  startTime: number; // Unix timestamp
  endTime?: number;
  status: "scheduled" | "active" | "completed";
  slotMappings: SlotMapping[];
  createdAt: number;
  updatedAt: number;
  createdBy?: string; // User ID
}

export type CommandType =
  | "obs_scene_switch"
  | "obs_source_visibility"
  | "obs_stream_start"
  | "obs_stream_stop"
  | "youtube_go_live";

// Command is a TOP-LEVEL Firestore collection
// All commands MUST include venueId, broadcastSessionId, slotId for scoping
export interface Command {
  id: string;
  venueId: string; // REQUIRED - for multi-venue scoping
  broadcastSessionId: string; // REQUIRED - for session scoping
  slotId: string; // REQUIRED - for slot scoping (examples: "A", "B", "C", "D")
  type: CommandType;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: number;
  processedAt?: number;
  processedBy?: string; // Agent ID that processed the command
  error?: string;
}

// AgentHeartbeat is a TOP-LEVEL Firestore collection
// All heartbeats MUST include venueId, broadcastSessionId, slotId for scoping
export interface AgentHeartbeat {
  agentId: string; // Unique per Tauri instance (also used as document ID)
  venueId: string; // REQUIRED - for multi-venue scoping
  broadcastSessionId: string; // REQUIRED - for session scoping
  slotId: string; // REQUIRED - for slot scoping (examples: "A", "B", "C", "D")
  obsStatus: "connected" | "disconnected" | "error";
  lastSeen: number; // Unix timestamp
  capabilities: string[]; // e.g., ["obs", "youtube"]
  metadata?: Record<string, unknown>;
}
