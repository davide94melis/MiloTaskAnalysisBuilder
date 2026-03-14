package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskDetailServiceTest {

    @Mock
    private TaskShellRepository taskShellRepository;

    @Mock
    private TaskAnalysisStepRepository taskAnalysisStepRepository;

    @Mock
    private TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository;

    @Mock
    private TaskMediaStorageService taskMediaStorageService;

    private TaskDetailService taskDetailService;

    @BeforeEach
    void setUp() {
        taskDetailService = new TaskDetailService(
                taskShellRepository,
                taskAnalysisStepRepository,
                taskAnalysisStepMediaRepository,
                new TaskDetailMapper(),
                taskMediaStorageService
        );
    }

    @Test
    void updatesMetadataAndPreservesSubmittedStepOrder() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID mediaId = UUID.fromString("aaaaaaaa-1111-1111-1111-111111111111");
        TaskShellEntity task = task(taskId, ownerId);

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Lavarsi le mani",
                "Autonomia personale",
                "Sequenza guidata per l'igiene",
                "Favorire autonomia nell'igiene quotidiana",
                "Usare rinforzo verbale lieve",
                "Bambino",
                "Guidato",
                "Intermedio",
                "Bagno",
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                                1,
                                "Apri l'acqua",
                                "Aprire il rubinetto lentamente",
                                true,
                                "Prompt verbale",
                                "Bravo subito",
                                1,
                                new UpdateTaskRequest.VisualSupportRequest(
                                        "Apri",
                                        null,
                                        new UpdateTaskRequest.StepImageRequest(
                                                mediaId,
                                                "task-a/image-1.png",
                                                "step-1.png",
                                                "image/png",
                                                321L,
                                                320,
                                                240,
                                                "Rubinetto aperto",
                                                "/api/tasks/%s/media/%s/content".formatted(taskId, mediaId)
                                        )
                                )
                        ),
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone su entrambe le mani",
                                null,
                                "Prompt visivo",
                                null,
                                2,
                                new UpdateTaskRequest.VisualSupportRequest(
                                        "Sapone",
                                        new UpdateTaskRequest.StepSymbolRequest("arasaac", "soap", "Sapone"),
                                        null
                                )
                        )
                )
        );

        List<TaskAnalysisStepEntity> persistedSteps = List.of(
                step(taskId, UUID.fromString("11111111-1111-1111-1111-111111111111"), 1, "Apri l'acqua"),
                step(taskId, UUID.fromString("22222222-2222-2222-2222-222222222222"), 2, "Insapona le mani")
        );
        persistedSteps.get(0).setRequired(true);
        persistedSteps.get(0).setSupportGuidance("Prompt verbale");
        persistedSteps.get(0).setReinforcementNotes("Bravo subito");
        persistedSteps.get(0).setEstimatedMinutes(1);
        persistedSteps.get(0).setVisualText("Apri");
        persistedSteps.get(1).setRequired(true);
        persistedSteps.get(1).setSupportGuidance("Prompt visivo");
        persistedSteps.get(1).setEstimatedMinutes(2);
        persistedSteps.get(1).setVisualText("Sapone");
        persistedSteps.get(1).setSymbolLibrary("arasaac");
        persistedSteps.get(1).setSymbolKey("soap");
        persistedSteps.get(1).setSymbolLabel("Sapone");

        TaskAnalysisStepMediaEntity uploadedImage = media(
                taskId,
                mediaId,
                UUID.fromString("11111111-1111-1111-1111-111111111111"),
                "task-a/image-1.png",
                "step-1.png",
                "Rubinetto aperto"
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskShellRepository.save(task)).thenReturn(task);
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId)).thenReturn(persistedSteps);
        when(taskAnalysisStepMediaRepository.findByIdAndTaskAnalysisId(uploadedImage.getId(), taskId))
                .thenReturn(Optional.of(uploadedImage));
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(taskId))
                .thenReturn(List.of(uploadedImage));
        when(taskMediaStorageService.buildAccessUrl(taskId, uploadedImage.getId()))
                .thenReturn("/api/tasks/%s/media/%s/content".formatted(taskId, uploadedImage.getId()));

        TaskDetailResponse response = taskDetailService.updateTask(taskId, ownerId, request);

        ArgumentCaptor<List<TaskAnalysisStepEntity>> stepsCaptor = ArgumentCaptor.forClass(List.class);
        verify(taskAnalysisStepRepository).saveAll(stepsCaptor.capture());

        List<TaskAnalysisStepEntity> savedSteps = stepsCaptor.getValue();
        assertThat(savedSteps).hasSize(2);
        assertThat(savedSteps.get(0).getPosition()).isEqualTo(1);
        assertThat(savedSteps.get(0).getTitle()).isEqualTo("Apri l'acqua");
        assertThat(savedSteps.get(0).isRequired()).isTrue();
        assertThat(savedSteps.get(0).getSupportGuidance()).isEqualTo("Prompt verbale");
        assertThat(savedSteps.get(0).getReinforcementNotes()).isEqualTo("Bravo subito");
        assertThat(savedSteps.get(0).getEstimatedMinutes()).isEqualTo(1);
        assertThat(savedSteps.get(0).getVisualText()).isEqualTo("Apri");
        assertThat(savedSteps.get(1).getPosition()).isEqualTo(2);
        assertThat(savedSteps.get(1).getTitle()).isEqualTo("Insapona le mani");
        assertThat(savedSteps.get(1).isRequired()).isTrue();
        assertThat(savedSteps.get(1).getSupportGuidance()).isEqualTo("Prompt visivo");
        assertThat(savedSteps.get(1).getEstimatedMinutes()).isEqualTo(2);
        assertThat(savedSteps.get(1).getVisualText()).isEqualTo("Sapone");
        assertThat(savedSteps.get(1).getSymbolLibrary()).isEqualTo("arasaac");
        assertThat(savedSteps.get(1).getSymbolKey()).isEqualTo("soap");

        assertThat(task.getTitle()).isEqualTo("Lavarsi le mani");
        assertThat(task.getCategory()).isEqualTo("Autonomia personale");
        assertThat(task.getDescription()).isEqualTo("Sequenza guidata per l'igiene");
        assertThat(task.getEducationalObjective()).isEqualTo("Favorire autonomia nell'igiene quotidiana");
        assertThat(task.getProfessionalNotes()).isEqualTo("Usare rinforzo verbale lieve");
        assertThat(task.getTargetLabel()).isEqualTo("Bambino");
        assertThat(task.getSupportLevel()).isEqualTo("Guidato");
        assertThat(task.getDifficultyLevel()).isEqualTo("Intermedio");
        assertThat(task.getContextLabel()).isEqualTo("Bagno");
        assertThat(task.getVisibility()).isEqualTo(TaskShellVisibility.PRIVATE);
        assertThat(task.getStepCount()).isEqualTo(2);

        assertThat(response.steps()).extracting(TaskDetailResponse.TaskStepDetail::title)
                .containsExactly("Apri l'acqua", "Insapona le mani");
        assertThat(response.steps()).extracting(TaskDetailResponse.TaskStepDetail::position)
                .containsExactly(1, 2);
        assertThat(response.steps()).extracting(TaskDetailResponse.TaskStepDetail::required)
                .containsExactly(true, true);
        assertThat(response.steps().get(0).visualSupport().image().mediaId()).isEqualTo(uploadedImage.getId());
        assertThat(response.steps().get(0).visualSupport().image().url())
                .isEqualTo("/api/tasks/%s/media/%s/content".formatted(taskId, uploadedImage.getId()));
        assertThat(response.steps().get(1).visualSupport().symbol().key()).isEqualTo("soap");
    }

    @Test
    void returnsSavedTaskDetailWithExistingStepOrder() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        TaskShellEntity task = task(taskId, ownerId);
        task.setDescription("Descrizione salvata");
        task.setEducationalObjective("Obiettivo salvato");
        task.setProfessionalNotes("Nota salvata");
        task.setDifficultyLevel("Base");
        task.setContextLabel("Classe");
        task.setSupportLevel("Visivo");
        task.setTargetLabel("Gruppo");
        task.setStepCount(2);

        List<TaskAnalysisStepEntity> steps = List.of(
                step(taskId, UUID.fromString("33333333-3333-3333-3333-333333333333"), 1, "Primo passo"),
                step(taskId, UUID.fromString("44444444-4444-4444-4444-444444444444"), 2, "Secondo passo")
        );
        steps.get(0).setRequired(false);
        steps.get(0).setSupportGuidance("Indicazione gestuale");
        steps.get(0).setReinforcementNotes("Token");
        steps.get(0).setEstimatedMinutes(3);
        steps.get(0).setVisualText("Bagna");
        steps.get(1).setSymbolLibrary("arasaac");
        steps.get(1).setSymbolKey("rinse");
        steps.get(1).setSymbolLabel("Sciacqua");

        TaskAnalysisStepMediaEntity media = media(
                taskId,
                UUID.fromString("66666666-6666-6666-6666-666666666666"),
                UUID.fromString("33333333-3333-3333-3333-333333333333"),
                "task-b/image-1.png",
                "step-3.png",
                "Acqua sulle mani"
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(eq(taskId))).thenReturn(steps);
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(taskId))
                .thenReturn(List.of(media));
        when(taskMediaStorageService.buildAccessUrl(taskId, media.getId()))
                .thenReturn("/api/tasks/%s/media/%s/content".formatted(taskId, media.getId()));

        TaskDetailResponse response = taskDetailService.getTaskDetail(taskId, ownerId);

        assertThat(response.description()).isEqualTo("Descrizione salvata");
        assertThat(response.educationalObjective()).isEqualTo("Obiettivo salvato");
        assertThat(response.professionalNotes()).isEqualTo("Nota salvata");
        assertThat(response.contextLabel()).isEqualTo("Classe");
        assertThat(response.difficultyLevel()).isEqualTo("Base");
        assertThat(response.environmentLabel()).isEqualTo("Classe");
        assertThat(response.supportLevel()).isEqualTo("Visivo");
        assertThat(response.targetLabel()).isEqualTo("Gruppo");
        assertThat(response.steps().get(0).required()).isFalse();
        assertThat(response.steps().get(0).supportGuidance()).isEqualTo("Indicazione gestuale");
        assertThat(response.steps().get(0).reinforcementNotes()).isEqualTo("Token");
        assertThat(response.steps().get(0).estimatedMinutes()).isEqualTo(3);
        assertThat(response.steps().get(0).visualSupport().text()).isEqualTo("Bagna");
        assertThat(response.steps().get(0).visualSupport().image().storageKey()).isEqualTo("task-b/image-1.png");
        assertThat(response.steps().get(1).visualSupport().symbol().label()).isEqualTo("Sciacqua");
        assertThat(response.steps()).extracting(TaskDetailResponse.TaskStepDetail::id)
                .containsExactly(
                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                        UUID.fromString("44444444-4444-4444-4444-444444444444")
                );
        assertThat(response.variantRole()).isEqualTo("standalone");
        assertThat(response.relatedVariants()).isEmpty();
    }

    @Test
    void returnsFamilyMetadataAndSiblingNavigationForVariantDetails() {
        UUID ownerId = UUID.randomUUID();
        UUID rootTaskId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID currentTaskId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UUID siblingTaskId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

        TaskShellEntity currentTask = task(currentTaskId, ownerId);
        currentTask.setTitle("Lavarsi le mani");
        currentTask.setSupportLevel("Visivo");
        currentTask.setVariantFamilyId(rootTaskId);

        TaskShellEntity rootTask = task(rootTaskId, ownerId);
        rootTask.setTitle("Lavarsi le mani");
        rootTask.setSupportLevel("Guidato");

        TaskShellEntity siblingTask = task(siblingTaskId, ownerId);
        siblingTask.setTitle("Lavarsi le mani");
        siblingTask.setSupportLevel("Autonomo");
        siblingTask.setVariantFamilyId(rootTaskId);

        TaskAnalysisStepEntity step = step(currentTaskId, UUID.fromString("33333333-3333-3333-3333-333333333333"), 1, "Primo passo");
        step.setVisualText("Bagna");

        when(taskShellRepository.findByIdAndOwnerId(currentTaskId, ownerId)).thenReturn(Optional.of(currentTask));
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(currentTaskId)).thenReturn(List.of(step));
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(currentTaskId)).thenReturn(List.of());
        when(taskShellRepository.findByIdIn(List.of(rootTaskId))).thenReturn(List.of(rootTask));
        when(taskShellRepository.findByVariantFamilyIdIn(List.of(rootTaskId))).thenReturn(List.of(currentTask, siblingTask));

        TaskDetailResponse response = taskDetailService.getTaskDetail(currentTaskId, ownerId);

        assertThat(response.variantFamilyId()).isEqualTo(rootTaskId);
        assertThat(response.variantRootTaskId()).isEqualTo(rootTaskId);
        assertThat(response.variantRootTitle()).isEqualTo("Lavarsi le mani");
        assertThat(response.variantRole()).isEqualTo("variant");
        assertThat(response.variantCount()).isEqualTo(3);
        assertThat(response.relatedVariants()).extracting(TaskDetailResponse.RelatedVariantSummary::id)
                .containsExactly(rootTaskId, siblingTaskId);
        assertThat(response.relatedVariants()).extracting(TaskDetailResponse.RelatedVariantSummary::variantRole)
                .containsExactly("root", "variant");
        assertThat(response.relatedVariants()).extracting(TaskDetailResponse.RelatedVariantSummary::supportLevel)
                .containsExactly("Guidato", "Autonomo");
    }

    @Test
    void preservesMediaAssociationWhenExistingStepsAreReordered() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID firstStepId = UUID.fromString("99999999-1111-1111-1111-111111111111");
        UUID secondStepId = UUID.fromString("99999999-2222-2222-2222-222222222222");
        UUID mediaId = UUID.fromString("99999999-3333-3333-3333-333333333333");
        TaskShellEntity task = task(taskId, ownerId);

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Lavarsi le mani",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                secondStepId,
                                1,
                                "Secondo passo",
                                "Chiudi l'acqua",
                                true,
                                null,
                                null,
                                1,
                                new UpdateTaskRequest.VisualSupportRequest("Chiudi", null, null)
                        ),
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                firstStepId,
                                2,
                                "Primo passo",
                                "Apri l'acqua",
                                true,
                                null,
                                null,
                                1,
                                new UpdateTaskRequest.VisualSupportRequest(
                                        "Apri",
                                        null,
                                        new UpdateTaskRequest.StepImageRequest(
                                                mediaId,
                                                "task-a/image-1.png",
                                                "step-1.png",
                                                "image/png",
                                                321L,
                                                320,
                                                240,
                                                "Rubinetto aperto",
                                                "/api/tasks/%s/media/%s/content".formatted(taskId, mediaId)
                                        )
                                )
                        )
                )
        );

        TaskAnalysisStepEntity reorderedFirst = step(taskId, secondStepId, 1, "Secondo passo");
        reorderedFirst.setVisualText("Chiudi");
        TaskAnalysisStepEntity reorderedSecond = step(taskId, firstStepId, 2, "Primo passo");
        reorderedSecond.setVisualText("Apri");

        TaskAnalysisStepMediaEntity uploadedImage = media(
                taskId,
                mediaId,
                firstStepId,
                "task-a/image-1.png",
                "step-1.png",
                "Rubinetto aperto"
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskShellRepository.save(task)).thenReturn(task);
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId))
                .thenReturn(List.of(reorderedFirst, reorderedSecond));
        when(taskAnalysisStepMediaRepository.findByIdAndTaskAnalysisId(mediaId, taskId))
                .thenReturn(Optional.of(uploadedImage));
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(taskId))
                .thenReturn(List.of(uploadedImage));
        when(taskMediaStorageService.buildAccessUrl(taskId, mediaId))
                .thenReturn("/api/tasks/%s/media/%s/content".formatted(taskId, mediaId));

        TaskDetailResponse response = taskDetailService.updateTask(taskId, ownerId, request);

        assertThat(response.steps()).extracting(TaskDetailResponse.TaskStepDetail::id)
                .containsExactly(secondStepId, firstStepId);
        assertThat(response.steps().get(1).visualSupport().image().mediaId()).isEqualTo(mediaId);
        assertThat(uploadedImage.getTaskAnalysisStepId()).isEqualTo(firstStepId);
        verify(taskAnalysisStepMediaRepository).save(uploadedImage);
    }

    @Test
    void rejectsNegativeEstimatedMinutes() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        TaskShellEntity task = task(taskId, ownerId);

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Lavarsi le mani",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                null,
                                1,
                                "Step",
                                "Descrizione",
                                true,
                                null,
                                null,
                                -1,
                                new UpdateTaskRequest.VisualSupportRequest("Step", null, null)
                        )
                )
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> taskDetailService.updateTask(taskId, ownerId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("estimatedMinutes must be non-negative");
    }

    @Test
    void addsNewStepsAndDefaultsRequiredWhenMissing() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        TaskShellEntity task = task(taskId, ownerId);

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Task",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                null,
                                1,
                                "Nuovo step",
                                "Descrizione",
                                null,
                                null,
                                null,
                                null,
                                new UpdateTaskRequest.VisualSupportRequest("Nuovo step", null, null)
                        )
                )
        );

        TaskAnalysisStepEntity persistedStep = step(taskId, UUID.fromString("55555555-5555-5555-5555-555555555555"), 1, "Nuovo step");
        persistedStep.setVisualText("Nuovo step");

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskShellRepository.save(task)).thenReturn(task);
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId)).thenReturn(List.of(persistedStep));
        when(taskAnalysisStepMediaRepository.findByTaskAnalysisIdOrderByCreatedAtAscIdAsc(taskId)).thenReturn(List.of());

        taskDetailService.updateTask(taskId, ownerId, request);

        ArgumentCaptor<List<TaskAnalysisStepEntity>> stepsCaptor = ArgumentCaptor.forClass(List.class);
        verify(taskAnalysisStepRepository).saveAll(stepsCaptor.capture());
        assertThat(stepsCaptor.getValue().get(0).isRequired()).isTrue();
    }

    @Test
    void rejectsStepWithoutAnyVisualSupport() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        TaskShellEntity task = task(taskId, ownerId);

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Task",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                null,
                                1,
                                "Nuovo step",
                                "Descrizione",
                                true,
                                null,
                                null,
                                null,
                                new UpdateTaskRequest.VisualSupportRequest(null, null, null)
                        )
                )
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));

        assertThatThrownBy(() -> taskDetailService.updateTask(taskId, ownerId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("at least one visual support");
    }

    @Test
    void rejectsUnknownTaskMediaReference() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID mediaId = UUID.fromString("77777777-7777-7777-7777-777777777777");
        TaskShellEntity task = task(taskId, ownerId);

        UpdateTaskRequest request = new UpdateTaskRequest(
                "Task",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "private",
                List.of(
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("88888888-8888-8888-8888-888888888888"),
                                1,
                                "Nuovo step",
                                "Descrizione",
                                true,
                                null,
                                null,
                                null,
                                new UpdateTaskRequest.VisualSupportRequest(
                                        "Foto",
                                        null,
                                        new UpdateTaskRequest.StepImageRequest(
                                                mediaId,
                                                "missing.png",
                                                "missing.png",
                                                "image/png",
                                                12L,
                                                10,
                                                10,
                                                null,
                                                null
                                        )
                                )
                        )
                )
        );

        TaskAnalysisStepEntity persistedStep = step(
                taskId,
                UUID.fromString("88888888-8888-8888-8888-888888888888"),
                1,
                "Nuovo step"
        );
        persistedStep.setVisualText("Foto");

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId)).thenReturn(List.of(persistedStep));
        when(taskAnalysisStepMediaRepository.findByIdAndTaskAnalysisId(mediaId, taskId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskDetailService.updateTask(taskId, ownerId, request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Unknown media reference for task");
    }

    private TaskShellEntity task(UUID taskId, UUID ownerId) {
        TaskShellEntity task = new TaskShellEntity();
        task.setId(taskId);
        task.setOwnerId(ownerId);
        task.setTitle("Task");
        task.setStatus(TaskShellStatus.DRAFT);
        task.setVisibility(TaskShellVisibility.PRIVATE);
        task.setAuthorName("teacher@example.com");
        task.setUpdatedAt(Instant.parse("2026-03-13T12:00:00Z"));
        return task;
    }

    private TaskAnalysisStepEntity step(UUID taskId, UUID stepId, int position, String title) {
        TaskAnalysisStepEntity step = new TaskAnalysisStepEntity();
        step.setId(stepId);
        step.setTaskAnalysisId(taskId);
        step.setPosition(position);
        step.setTitle(title);
        step.setDescription(title + " description");
        step.setRequired(true);
        return step;
    }

    private TaskAnalysisStepMediaEntity media(
            UUID taskId,
            UUID mediaId,
            UUID stepId,
            String storageKey,
            String fileName,
            String altText
    ) {
        TaskAnalysisStepMediaEntity media = new TaskAnalysisStepMediaEntity();
        media.setId(mediaId);
        media.setTaskAnalysisId(taskId);
        media.setTaskAnalysisStepId(stepId);
        media.setKind("image");
        media.setStorageProvider("filesystem");
        media.setStorageBucket("task-step-media");
        media.setStorageKey(storageKey);
        media.setFileName(fileName);
        media.setMimeType("image/png");
        media.setFileSizeBytes(1024);
        media.setWidth(320);
        media.setHeight(240);
        media.setAltText(altText);
        return media;
    }
}
