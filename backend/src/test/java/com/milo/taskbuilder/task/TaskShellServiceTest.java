package com.milo.taskbuilder.task;

import com.milo.taskbuilder.library.dto.TaskCardResponse;
import com.milo.taskbuilder.library.dto.TaskLibraryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        UUID familyRootId = UUID.randomUUID();
        UUID sourceTaskId = UUID.randomUUID();
        TaskShellEntity sourceTask = new TaskShellEntity();
        sourceTask.setId(sourceTaskId);
        sourceTask.setOwnerId(ownerId);
        sourceTask.setTitle("Lavarsi le mani");
        sourceTask.setVariantFamilyId(familyRootId);
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
        when(repository.findByIdIn(List.of(UUID.fromString("22222222-2222-2222-2222-222222222222"))))
                .thenReturn(List.of(task(
                        UUID.fromString("22222222-2222-2222-2222-222222222222"),
                        ownerId,
                        "Lavarsi le mani",
                        "Guidato"
                )));
        when(repository.findByVariantFamilyIdIn(List.of(UUID.fromString("22222222-2222-2222-2222-222222222222"))))
                .thenReturn(List.of());
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
        assertThat(duplicated.sourceTaskId()).isEqualTo(sourceTaskId);
        assertThat(duplicated.variantFamilyId()).isNull();
        assertThat(duplicated.variantRole()).isEqualTo("standalone");
        assertThat(duplicated.variantCount()).isEqualTo(1);
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

    @Test
    void listLibraryAddsFamilyMetadataForStandaloneRootAndVariantCards() {
        UUID ownerId = UUID.randomUUID();
        UUID rootTaskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID variantTaskId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID standaloneTaskId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

        TaskShellEntity root = task(rootTaskId, ownerId, "Lavarsi le mani", "Guidato");
        TaskShellEntity variant = task(variantTaskId, ownerId, "Lavarsi le mani", "Visivo");
        variant.setSourceTaskId(rootTaskId);
        variant.setVariantFamilyId(rootTaskId);
        TaskShellEntity standalone = task(standaloneTaskId, ownerId, "Preparare lo zaino", "Autonomo");

        when(repository.findLibraryCards(ownerId, null, null, null, null, null, null, null))
                .thenReturn(List.of(root, variant, standalone));
        when(repository.findByIdIn(List.of(rootTaskId, standaloneTaskId)))
                .thenReturn(List.of(root, standalone));
        when(repository.findByVariantFamilyIdIn(List.of(rootTaskId, standaloneTaskId)))
                .thenReturn(List.of(variant));

        TaskLibraryResponse response = service.listLibrary(ownerId, new TaskShellService.TaskLibraryFilter(
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));

        assertThat(response.items()).hasSize(3);
        Map<UUID, TaskCardResponse> cardsById = response.items().stream()
                .collect(java.util.stream.Collectors.toMap(TaskCardResponse::id, card -> card));

        assertThat(cardsById.get(rootTaskId).variantRole()).isEqualTo("root");
        assertThat(cardsById.get(rootTaskId).variantRootTaskId()).isEqualTo(rootTaskId);
        assertThat(cardsById.get(rootTaskId).variantRootTitle()).isEqualTo("Lavarsi le mani");
        assertThat(cardsById.get(rootTaskId).variantCount()).isEqualTo(2);

        assertThat(cardsById.get(variantTaskId).variantFamilyId()).isEqualTo(rootTaskId);
        assertThat(cardsById.get(variantTaskId).variantRole()).isEqualTo("variant");
        assertThat(cardsById.get(variantTaskId).variantRootTaskId()).isEqualTo(rootTaskId);
        assertThat(cardsById.get(variantTaskId).variantRootTitle()).isEqualTo("Lavarsi le mani");
        assertThat(cardsById.get(variantTaskId).variantCount()).isEqualTo(2);

        assertThat(cardsById.get(standaloneTaskId).variantFamilyId()).isNull();
        assertThat(cardsById.get(standaloneTaskId).variantRootTaskId()).isNull();
        assertThat(cardsById.get(standaloneTaskId).variantRole()).isEqualTo("standalone");
        assertThat(cardsById.get(standaloneTaskId).variantCount()).isEqualTo(1);
    }

    @Test
    void createVariantUsesSourceAsFamilyRootAndCopiesMediaReferences() {
        UUID ownerId = UUID.randomUUID();
        UUID sourceTaskId = UUID.fromString("aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa");
        UUID createdVariantId = UUID.fromString("bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb");
        UUID savedStepId = UUID.fromString("cccccccc-3333-3333-3333-cccccccccccc");
        TaskShellEntity sourceTask = task(sourceTaskId, ownerId, "Lavarsi le mani", "Guidato");
        sourceTask.setStepCount(1);

        TaskAnalysisStepEntity sourceStep = new TaskAnalysisStepEntity();
        sourceStep.setId(UUID.fromString("dddddddd-4444-4444-4444-dddddddddddd"));
        sourceStep.setTaskAnalysisId(sourceTaskId);
        sourceStep.setPosition(1);
        sourceStep.setTitle("Apri il rubinetto");

        TaskAnalysisStepMediaEntity sourceMedia = new TaskAnalysisStepMediaEntity();
        sourceMedia.setId(UUID.fromString("eeeeeeee-5555-5555-5555-eeeeeeeeeeee"));
        sourceMedia.setTaskAnalysisId(sourceTaskId);
        sourceMedia.setTaskAnalysisStepId(sourceStep.getId());
        sourceMedia.setKind("image");
        sourceMedia.setStorageKey("tasks/source/media-1.png");
        sourceMedia.setFileName("rubinetto.png");

        TaskShellEntity savedVariant = task(createdVariantId, ownerId, "Lavarsi le mani", "Autonomo");
        savedVariant.setSourceTaskId(sourceTaskId);
        savedVariant.setVariantFamilyId(sourceTaskId);
        savedVariant.setStepCount(1);

        when(repository.findAccessibleById(sourceTaskId, ownerId)).thenReturn(Optional.of(sourceTask));
        when(repository.save(any(TaskShellEntity.class))).thenAnswer(invocation -> {
            TaskShellEntity entity = invocation.getArgument(0);
            entity.setId(createdVariantId);
            return entity;
        });
        when(repository.findByIdIn(List.of(sourceTaskId))).thenReturn(List.of(sourceTask));
        when(repository.findByVariantFamilyIdIn(List.of(sourceTaskId))).thenReturn(List.of(savedVariant));
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(sourceTaskId))
                .thenReturn(List.of(sourceStep));
        when(taskAnalysisStepRepository.saveAll(any())).thenAnswer(invocation -> {
            @SuppressWarnings("unchecked")
            List<TaskAnalysisStepEntity> steps = invocation.getArgument(0);
            steps.get(0).setId(savedStepId);
            return steps;
        });
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(sourceTaskId))
                .thenReturn(List.of(sourceMedia));
        when(taskAnalysisStepMediaRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        TaskCardResponse created = service.createVariant(
                sourceTaskId,
                ownerId,
                "teacher@example.com",
                new com.milo.taskbuilder.library.dto.CreateTaskRequest("Lavarsi le mani", null, sourceTaskId, "Autonomo")
        );

        assertThat(created.id()).isEqualTo(createdVariantId);
        assertThat(created.sourceTaskId()).isEqualTo(sourceTaskId);
        assertThat(created.supportLevel()).isEqualTo("Autonomo");
        assertThat(created.variantFamilyId()).isEqualTo(sourceTaskId);
        assertThat(created.variantRootTaskId()).isEqualTo(sourceTaskId);
        assertThat(created.variantRootTitle()).isEqualTo("Lavarsi le mani");
        assertThat(created.variantRole()).isEqualTo("variant");
        assertThat(created.variantCount()).isEqualTo(2);

        @SuppressWarnings("unchecked")
        List<TaskAnalysisStepMediaEntity> copiedMedia = (List<TaskAnalysisStepMediaEntity>) org.mockito.Mockito.mockingDetails(taskAnalysisStepMediaRepository)
                .getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("saveAll"))
                .findFirst()
                .orElseThrow()
                .getArgument(0);
        assertThat(copiedMedia).hasSize(1);
        assertThat(copiedMedia.get(0).getTaskAnalysisId()).isEqualTo(createdVariantId);
        assertThat(copiedMedia.get(0).getTaskAnalysisStepId()).isEqualTo(savedStepId);
        assertThat(copiedMedia.get(0).getStorageKey()).isEqualTo("tasks/source/media-1.png");
    }

    @Test
    void createVariantUsesExistingFamilyRootForSecondGenerationVariant() {
        UUID ownerId = UUID.randomUUID();
        UUID familyRootId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID sourceVariantId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID createdVariantId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        TaskShellEntity sourceVariant = task(sourceVariantId, ownerId, "Lavarsi le mani", "Visivo");
        sourceVariant.setVariantFamilyId(familyRootId);

        TaskShellEntity familyRoot = task(familyRootId, ownerId, "Lavarsi le mani", "Guidato");
        TaskShellEntity savedVariant = task(createdVariantId, ownerId, "Lavarsi le mani", "Autonomo");
        savedVariant.setSourceTaskId(sourceVariantId);
        savedVariant.setVariantFamilyId(familyRootId);

        when(repository.findAccessibleById(sourceVariantId, ownerId)).thenReturn(Optional.of(sourceVariant));
        when(repository.save(any(TaskShellEntity.class))).thenAnswer(invocation -> {
            TaskShellEntity entity = invocation.getArgument(0);
            entity.setId(createdVariantId);
            return entity;
        });
        when(repository.findByIdIn(List.of(familyRootId))).thenReturn(List.of(familyRoot));
        when(repository.findByVariantFamilyIdIn(List.of(familyRootId))).thenReturn(List.of(sourceVariant, savedVariant));
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(sourceVariantId))
                .thenReturn(List.of());

        TaskCardResponse created = service.createVariant(
                sourceVariantId,
                ownerId,
                "teacher@example.com",
                new com.milo.taskbuilder.library.dto.CreateTaskRequest("Lavarsi le mani", null, sourceVariantId, "Autonomo")
        );

        assertThat(created.variantFamilyId()).isEqualTo(familyRootId);
        assertThat(created.variantRootTaskId()).isEqualTo(familyRootId);
        assertThat(created.variantRootTitle()).isEqualTo("Lavarsi le mani");
        assertThat(created.variantRole()).isEqualTo("variant");
        assertThat(created.variantCount()).isEqualTo(3);
    }

    @Test
    void createVariantRejectsBlankSupportLevel() {
        UUID ownerId = UUID.randomUUID();

        assertThatThrownBy(() -> service.createVariant(
                UUID.randomUUID(),
                ownerId,
                "teacher@example.com",
                new com.milo.taskbuilder.library.dto.CreateTaskRequest("Titolo", null, UUID.randomUUID(), "  ")
        ))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("400 BAD_REQUEST");
    }

    private TaskShellEntity task(UUID id, UUID ownerId, String title, String supportLevel) {
        TaskShellEntity task = new TaskShellEntity();
        task.setId(id);
        task.setOwnerId(ownerId);
        task.setTitle(title);
        task.setSupportLevel(supportLevel);
        task.setStatus(TaskShellStatus.DRAFT);
        task.setVisibility(TaskShellVisibility.PRIVATE);
        task.setAuthorName("teacher@example.com");
        task.setUpdatedAt(Instant.parse("2026-03-13T12:00:00Z"));
        return task;
    }
}
