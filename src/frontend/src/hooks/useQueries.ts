import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Request,
  RequestStats,
  SubmitRequestInput,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

export function useMyRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<Request[]>({
    queryKey: ["myRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<Request[]>({
    queryKey: ["allRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllPendingRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<Request[]>({
    queryKey: ["pendingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPendingRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllApprovedRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<Request[]>({
    queryKey: ["approvedRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllApprovedRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useStats() {
  const { actor, isFetching } = useActor();
  return useQuery<RequestStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      if (!actor)
        return {
          total: 0n,
          pending: 0n,
          completed: 0n,
          approved: 0n,
          rejected: 0n,
          seen: 0n,
          unableToFulfill: 0n,
        };
      return actor.getStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useSubmitRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitRequestInput) => {
      if (!actor) throw new Error("No actor");
      return actor.submitRequest(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useApproveRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: bigint; remarks: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.approveRequest(id, remarks);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["approvedRequests"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useRejectRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: bigint; remarks: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.rejectRequest(id, remarks);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useMarkCompleted() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markCompleted(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvedRequests"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useMarkSeen() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.markSeen(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvedRequests"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useMarkUnableToFulfill() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: bigint; note: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.markUnableToFulfill(id, note);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvedRequests"] });
      qc.invalidateQueries({ queryKey: ["allRequests"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
