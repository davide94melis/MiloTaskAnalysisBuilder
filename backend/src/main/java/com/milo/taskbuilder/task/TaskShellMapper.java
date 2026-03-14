package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.TaskCardResponse;
import org.springframework.stereotype.Component;

@Component
public class TaskShellMapper {

    public TaskCardResponse toCard(TaskShellEntity entity) {
        return toCard(entity, FamilyMetadata.standalone());
    }

    public TaskCardResponse toCard(TaskShellEntity entity, FamilyMetadata familyMetadata) {
        return new TaskCardResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getCategory(),
                entity.getTargetLabel(),
                entity.getSupportLevel(),
                entity.getContextLabel(),
                entity.getVisibility().getValue(),
                entity.getStatus().getValue(),
                entity.getStepCount(),
                entity.getAuthorName(),
                entity.getSourceTaskId(),
                entity.getUpdatedAt(),
                familyMetadata.variantFamilyId(),
                familyMetadata.variantRootTaskId(),
                familyMetadata.variantRootTitle(),
                familyMetadata.variantRole(),
                familyMetadata.variantCount()
        );
    }

    public record FamilyMetadata(
            java.util.UUID variantFamilyId,
            java.util.UUID variantRootTaskId,
            String variantRootTitle,
            String variantRole,
            int variantCount
    ) {
        static FamilyMetadata standalone() {
            return new FamilyMetadata(null, null, null, "standalone", 1);
        }
    }
}
