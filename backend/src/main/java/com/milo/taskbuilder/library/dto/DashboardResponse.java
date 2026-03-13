package com.milo.taskbuilder.library.dto;

import java.util.List;

public record DashboardResponse(
        List<TaskCardResponse> recentDrafts,
        List<TaskCardResponse> seedTemplates,
        DashboardStats stats
) {
    public record DashboardStats(
            int draftCount,
            int templateCount,
            int sharedCount
    ) {
    }
}
