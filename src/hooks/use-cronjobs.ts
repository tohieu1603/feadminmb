"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { CronjobListResponse, CronjobFilters, Cronjob, CronjobExecutionListResponse } from "@/types";

// Fetch all cronjobs (admin)
export function useCronjobs(filters: CronjobFilters) {
  return useQuery<CronjobListResponse>({
    queryKey: ["cronjobs", "admin", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.enabled !== undefined) params.append("enabled", String(filters.enabled));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.offset !== undefined) params.append("offset", String(filters.offset));

      const response = await api.get<CronjobListResponse>(`/cron/admin/all?${params}`);
      return response.data;
    },
  });
}

// Fetch single cronjob
export function useCronjob(id: string) {
  return useQuery<Cronjob>({
    queryKey: ["cronjob", id],
    queryFn: async () => {
      const response = await api.get<Cronjob>(`/cron/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch cronjob executions
export function useCronjobExecutions(cronjobId: string, limit = 20, offset = 0) {
  return useQuery<CronjobExecutionListResponse>({
    queryKey: ["cronjob", cronjobId, "executions", limit, offset],
    queryFn: async () => {
      const response = await api.get<CronjobExecutionListResponse>(
        `/cron/${cronjobId}/executions?limit=${limit}&offset=${offset}`
      );
      return response.data;
    },
    enabled: !!cronjobId,
  });
}
