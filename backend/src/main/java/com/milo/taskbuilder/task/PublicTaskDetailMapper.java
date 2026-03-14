package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.PublicSharedPresentResponse;
import com.milo.taskbuilder.task.dto.PublicSharedTaskResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.BiFunction;

@Component
public class PublicTaskDetailMapper {

    public PublicSharedTaskResponse toSharedTaskResponse(
            TaskShellEntity task,
            List<TaskAnalysisStepEntity> steps,
            Map<UUID, List<TaskAnalysisStepMediaEntity>> mediaByStepId,
            BiFunction<String, UUID, String> mediaUrlResolver,
            String shareToken
    ) {
        return new PublicSharedTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getCategory(),
                task.getDescription(),
                steps.size(),
                task.getUpdatedAt(),
                steps.stream()
                        .map(step -> new PublicSharedTaskResponse.SharedTaskStep(
                                step.getId(),
                                step.getPosition(),
                                step.getTitle(),
                                step.getDescription(),
                                step.isRequired(),
                                toVisualSupport(shareToken, mediaByStepId.getOrDefault(step.getId(), List.of()), step, mediaUrlResolver)
                        ))
                        .toList()
        );
    }

    public PublicSharedPresentResponse toSharedPresentResponse(
            TaskShellEntity task,
            List<TaskAnalysisStepEntity> steps,
            Map<UUID, List<TaskAnalysisStepMediaEntity>> mediaByStepId,
            BiFunction<String, UUID, String> mediaUrlResolver,
            String shareToken
    ) {
        return new PublicSharedPresentResponse(
                task.getId(),
                task.getTitle(),
                steps.size(),
                steps.stream()
                        .map(step -> new PublicSharedPresentResponse.PresentStep(
                                step.getId(),
                                step.getPosition(),
                                step.getTitle(),
                                step.getDescription(),
                                step.isRequired(),
                                toVisualSupport(shareToken, mediaByStepId.getOrDefault(step.getId(), List.of()), step, mediaUrlResolver)
                        ))
                        .toList()
        );
    }

    private PublicSharedTaskResponse.SharedVisualSupport toVisualSupport(
            String shareToken,
            List<TaskAnalysisStepMediaEntity> stepMedia,
            TaskAnalysisStepEntity step,
            BiFunction<String, UUID, String> mediaUrlResolver
    ) {
        return new PublicSharedTaskResponse.SharedVisualSupport(
                step.getVisualText(),
                toSymbol(step),
                stepMedia.stream()
                        .findFirst()
                        .map(media -> toImage(shareToken, media, mediaUrlResolver))
                        .orElse(null)
        );
    }

    private PublicSharedTaskResponse.SharedStepSymbol toSymbol(TaskAnalysisStepEntity step) {
        if (step.getSymbolLibrary() == null || step.getSymbolKey() == null) {
            return null;
        }
        return new PublicSharedTaskResponse.SharedStepSymbol(
                step.getSymbolLibrary(),
                step.getSymbolKey(),
                step.getSymbolLabel()
        );
    }

    private PublicSharedTaskResponse.SharedStepImage toImage(
            String shareToken,
            TaskAnalysisStepMediaEntity media,
            BiFunction<String, UUID, String> mediaUrlResolver
    ) {
        return new PublicSharedTaskResponse.SharedStepImage(
                media.getId(),
                media.getFileName(),
                media.getMimeType(),
                media.getFileSizeBytes(),
                media.getWidth(),
                media.getHeight(),
                media.getAltText(),
                mediaUrlResolver.apply(shareToken, media.getId())
        );
    }
}
