package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.TaskCardResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskShellServiceTest {

    @Mock
    private TaskShellRepository repository;

    @Mock
    private TaskAnalysisStepRepository taskAnalysisStepRepository;

    private TaskShellService service;

    @BeforeEach
    void setUp() {
        service = new TaskShellService(repository, taskAnalysisStepRepository, new TaskShellMapper());
    }

    @Test
    void duplicateCopiesExpandedStepFields() {
        UUID ownerId = UUID.randomUUID();
        UUID sourceTaskId = UUID.randomUUID();
        TaskShellEntity sourceTask = new TaskShellEntity();
        sourceTask.setId(sourceTaskId);
        sourceTask.setOwnerId(ownerId);
        sourceTask.setTitle("Lavarsi le mani");
        sourceTask.setStatus(TaskShellStatus.DRAFT);
        sourceTask.setVisibility(TaskShellVisibility.PRIVATE);
        sourceTask.setAuthorName("teacher@example.com");
        sourceTask.setStepCount(1);
        sourceTask.setUpdatedAt(Instant.parse("2026-03-13T12:00:00Z"));

        TaskAnalysisStepEntity sourceStep = new TaskAnalysisStepEntity();
        sourceStep.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        sourceStep.setTaskAnalysisId(sourceTaskId);
        sourceStep.setPosition(1);
        sourceStep.setTitle("Apri il rubinetto");
        sourceStep.setDescription("Ruota la manopola");
        sourceStep.setRequired(false);
        sourceStep.setSupportGuidance("Prompt gestuale");
        sourceStep.setReinforcementNotes("Lode");
        sourceStep.setEstimatedMinutes(2);

        when(repository.findAccessibleById(sourceTaskId, ownerId)).thenReturn(Optional.of(sourceTask));
        when(repository.save(any(TaskShellEntity.class))).thenAnswer((invocation) -> {
            TaskShellEntity saved = invocation.getArgument(0);
            saved.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
            return saved;
        });
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(sourceTaskId))
                .thenReturn(List.of(sourceStep));
        when(taskAnalysisStepRepository.saveAll(any())).thenAnswer((invocation) -> invocation.getArgument(0));

        TaskCardResponse duplicated = service.duplicate(sourceTaskId, ownerId, "teacher@example.com");

        assertThat(duplicated.id()).isEqualTo(UUID.fromString("22222222-2222-2222-2222-222222222222"));
        @SuppressWarnings("unchecked")
        List<TaskAnalysisStepEntity> copiedSteps = (List<TaskAnalysisStepEntity>) org.mockito.Mockito.mockingDetails(taskAnalysisStepRepository)
                .getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("saveAll"))
                .findFirst()
                .orElseThrow()
                .getArgument(0);
        assertThat(copiedSteps).hasSize(1);
        assertThat(copiedSteps.get(0).isRequired()).isFalse();
        assertThat(copiedSteps.get(0).getSupportGuidance()).isEqualTo("Prompt gestuale");
        assertThat(copiedSteps.get(0).getReinforcementNotes()).isEqualTo("Lode");
        assertThat(copiedSteps.get(0).getEstimatedMinutes()).isEqualTo(2);
        assertThat(copiedSteps.get(0).getPosition()).isEqualTo(1);
    }
}
