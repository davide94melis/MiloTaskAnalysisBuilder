package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.BiFunction;

@Component
public class TaskDetailMapper {

    public TaskDetailResponse toResponse(
            TaskShellEntity task,
            List<TaskAnalysisStepEntity> steps,
            Map<UUID, List<TaskAnalysisStepMediaEntity>> mediaByStepId,
            BiFunction<UUID, UUID, String> mediaUrlResolver,
            TaskShellMapper.FamilyMetadata familyMetadata,
            List<TaskDetailResponse.RelatedVariantSummary> relatedVariants
    ) {
        TaskShellMapper.FamilyMetadata effectiveFamilyMetadata =
                familyMetadata == null ? TaskShellMapper.FamilyMetadata.standalone() : familyMetadata;
        return new TaskDetailResponse(
                task.getId(),
                task.getTitle(),
                task.getCategory(),
                task.getDescription(),
                task.getEducationalObjective(),
                task.getProfessionalNotes(),
                task.getContextLabel(),
                task.getTargetLabel(),
                task.getSupportLevel(),
                task.getDifficultyLevel(),
                task.getContextLabel(),
                task.getVisibility().getValue(),
                task.getStatus().getValue(),
                task.getStepCount(),
                task.getAuthorName(),
                task.getSourceTaskId(),
                effectiveFamilyMetadata.variantFamilyId(),
                effectiveFamilyMetadata.variantRootTaskId(),
                effectiveFamilyMetadata.variantRootTitle(),
                effectiveFamilyMetadata.variantRole(),
                effectiveFamilyMetadata.variantCount(),
                relatedVariants,
                task.getUpdatedAt(),
                steps.stream()
                        .map(step -> toStepDetail(
                                step,
                                mediaByStepId.getOrDefault(step.getId(), List.of()),
                                mediaUrlResolver
                        ))
                        .toList()
        );
    }

    private TaskDetailResponse.TaskStepDetail toStepDetail(
            TaskAnalysisStepEntity step,
            List<TaskAnalysisStepMediaEntity> stepMedia,
            BiFunction<UUID, UUID, String> mediaUrlResolver
    ) {
        TaskDetailResponse.StepSymbolDetail symbol = toSymbol(step);
        TaskDetailResponse.StepImageDetail image = stepMedia.stream()
                .findFirst()
                .map(media -> toImage(step.getTaskAnalysisId(), media, mediaUrlResolver))
                .orElse(null);

        return new TaskDetailResponse.TaskStepDetail(
                step.getId(),
                step.getPosition(),
                step.getTitle(),
                step.getDescription(),
                step.isRequired(),
                step.getSupportGuidance(),
                step.getReinforcementNotes(),
                step.getEstimatedMinutes(),
                new TaskDetailResponse.VisualSupportDetail(step.getVisualText(), symbol, image)
        );
    }

    private TaskDetailResponse.StepSymbolDetail toSymbol(TaskAnalysisStepEntity step) {
        if (step.getSymbolLibrary() == null || step.getSymbolKey() == null) {
            return null;
        }
        return new TaskDetailResponse.StepSymbolDetail(
                step.getSymbolLibrary(),
                step.getSymbolKey(),
                step.getSymbolLabel()
        );
    }

    private TaskDetailResponse.StepImageDetail toImage(
            UUID taskId,
            TaskAnalysisStepMediaEntity media,
            BiFunction<UUID, UUID, String> mediaUrlResolver
    ) {
        return new TaskDetailResponse.StepImageDetail(
                media.getId(),
                media.getStorageKey(),
                media.getFileName(),
                media.getMimeType(),
                media.getFileSizeBytes(),
                media.getWidth(),
                media.getHeight(),
                media.getAltText(),
                mediaUrlResolver.apply(taskId, media.getId())
        );
    }
}
