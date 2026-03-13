package com.milo.taskbuilder.library.dto;

import java.util.List;

public record TaskLibraryFilterOptionsResponse(
        List<String> categories,
        List<String> contexts,
        List<String> targetLabels,
        List<String> authors,
        List<String> statuses,
        List<String> supportLevels
) {
}
