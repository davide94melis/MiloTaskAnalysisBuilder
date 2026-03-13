package com.milo.taskbuilder.library.dto;

import java.util.List;

public record TaskLibraryResponse(
        List<TaskCardResponse> items,
        TaskLibraryFilterOptionsResponse availableFilters
) {
}
