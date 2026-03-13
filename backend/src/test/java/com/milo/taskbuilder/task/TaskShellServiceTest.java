package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.TaskCardResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskShellServiceTest {

    @Mock
    private TaskShellRepository repository;

    @Mock
    private TaskAnalysisStepRepository taskAnalysisStepRepository;

    @Mock
    private TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository;

    private TaskShellService service;

    @BeforeEach
    void setUp() {
        service = new TaskShellService(repository, taskAnalysisStepRepository, taskAnalysisStepMediaRepository, new TaskShellMapper());
    }

    @Test
    void duplicateCopiesExpandedStepFieldsAndMediaReferences() {
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
        sourceStep.setVisualText("Apri");
        sourceStep.setSymbolLibrary("symwriter");
        sourceStep.setSymbolKey("tap");
        sourceStep.setSymbolLabel("Rubinetto");

        TaskAnalysisStepMediaEntity sourceMedia = new TaskAnalysisStepMediaEntity();
        sourceMedia.setId(UUID.fromString("33333333-3333-3333-3333-333333333333"));
        sourceMedia.setTaskAnalysisId(sourceTaskId);
        sourceMedia.setTaskAnalysisStepId(sourceStep.getId());
        sourceMedia.setKind("image");
        sourceMedia.setStorageProvider("filesystem");
        sourceMedia.setStorageBucket("task-step-media");
        sourceMedia.setStorageKey("tasks/source/media-1.png");
        sourceMedia.setFileName("rubinetto.png");
        sourceMedia.setMimeType("image/png");
        sourceMedia.setFileSizeBytes(2048);
        sourceMedia.setWidth(640);
        sourceMedia.setHeight(480);
        sourceMedia.setAltText("Rubinetto");

        when(repository.findAccessibleById(sourceTaskId, ownerId)).thenReturn(Optional.of(sourceTask));
        when(repository.save(any(TaskShellEntity.class))).thenAnswer((invocation) -> {
            TaskShellEntity saved = invocation.getArgument(0);
            saved.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
            return saved;
        });
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(sourceTaskId))
                .thenReturn(List.of(sourceStep));
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(sourceTaskId))
                .thenReturn(List.of(sourceMedia));
        when(taskAnalysisStepRepository.saveAll(any())).thenAnswer((invocation) -> {
            @SuppressWarnings("unchecked")
            List<TaskAnalysisStepEntity> steps = invocation.getArgument(0);
            List<TaskAnalysisStepEntity> savedSteps = new ArrayList<>();
            for (int index = 0; index < steps.size(); index++) {
                TaskAnalysisStepEntity step = steps.get(index);
                if (step.getId() == null) {
                    step.setId(UUID.fromString("44444444-4444-4444-4444-444444444444"));
                }
                savedSteps.add(step);
            }
            return savedSteps;
        });
        when(taskAnalysisStepMediaRepository.saveAll(any())).thenAnswer((invocation) -> invocation.getArgument(0));

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
        assertThat(copiedSteps.get(0).getVisualText()).isEqualTo("Apri");
        assertThat(copiedSteps.get(0).getSymbolLibrary()).isEqualTo("symwriter");
        assertThat(copiedSteps.get(0).getSymbolKey()).isEqualTo("tap");
        assertThat(copiedSteps.get(0).getSymbolLabel()).isEqualTo("Rubinetto");

        @SuppressWarnings("unchecked")
        List<TaskAnalysisStepMediaEntity> copiedMedia = (List<TaskAnalysisStepMediaEntity>) org.mockito.Mockito.mockingDetails(taskAnalysisStepMediaRepository)
                .getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("saveAll"))
                .findFirst()
                .orElseThrow()
                .getArgument(0);
        assertThat(copiedMedia).hasSize(1);
        assertThat(copiedMedia.get(0).getTaskAnalysisId()).isEqualTo(duplicated.id());
        assertThat(copiedMedia.get(0).getTaskAnalysisStepId()).isEqualTo(copiedSteps.get(0).getId());
        assertThat(copiedMedia.get(0).getStorageKey()).isEqualTo("tasks/source/media-1.png");
        assertThat(copiedMedia.get(0).getFileName()).isEqualTo("rubinetto.png");
        assertThat(copiedMedia.get(0).getAltText()).isEqualTo("Rubinetto");
        verify(taskAnalysisStepMediaRepository).saveAll(any());
    }
}
