import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RequestStats {
    total: bigint;
    pending: bigint;
    unableToFulfill: bigint;
    seen: bigint;
    completed: bigint;
    approved: bigint;
    rejected: bigint;
}
export interface SubmitRequestInput {
    title: string;
    submitterName: string;
    categoryText: string;
    priorityText: string;
    description: string;
    quantity?: bigint;
    expectedDate: string;
    location: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface Request {
    id: bigint;
    status: Status;
    completedAt?: bigint;
    title: string;
    adminActionAt?: bigint;
    submittedByName: string;
    submittedAt: bigint;
    submittedBy: Principal;
    description: string;
    reviewedAt?: bigint;
    reviewedBy?: Principal;
    quantity?: bigint;
    category: Category;
    priority: Priority;
    reviewRemarks?: string;
    expectedDate: string;
    adminActionNote?: string;
    location: string;
}
export enum Category {
    Maintenance = "Maintenance",
    Stationery = "Stationery",
    ITEquipment = "ITEquipment",
    Other = "Other",
    LabEquipment = "LabEquipment"
}
export enum Priority {
    Low = "Low",
    High = "High",
    Medium = "Medium",
    Urgent = "Urgent"
}
export enum Status {
    Seen = "Seen",
    Approved = "Approved",
    Rejected = "Rejected",
    UnableToFulfill = "UnableToFulfill",
    Completed = "Completed",
    Pending = "Pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    approveRequest(requestId: bigint, remarks: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllApprovedRequests(): Promise<Array<Request>>;
    getAllPendingRequests(): Promise<Array<Request>>;
    getAllRequests(): Promise<Array<Request>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyRequests(): Promise<Array<Request>>;
    getRequest(requestId: bigint): Promise<Request>;
    getStats(): Promise<RequestStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markCompleted(requestId: bigint): Promise<void>;
    markSeen(requestId: bigint): Promise<void>;
    markUnableToFulfill(requestId: bigint, note: string): Promise<void>;
    rejectRequest(requestId: bigint, remarks: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitRequest(input: SubmitRequestInput): Promise<bigint>;
}
