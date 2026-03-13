package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskDetailResponse;
import com.milo.taskbuilder.task.dto.UpdateTaskRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskDetailServiceTest {

    @Mock
    private TaskShellRepository taskShellRepository;

    @Mock
    private TaskAnalysisStepRepository taskAnalysisStepRepository;

    private TaskDetailService taskDetailService;

    @BeforeEach
    void setUp() {
        taskDetailService = new TaskDetailService(
                taskShellRepository,
                taskAnalysisStepRepository,
                new TaskDetailMapper()
        );
    }

    @Test
    void updatesMetadataAndPreservesSubmittedStepOrder() {
        UUID ownerId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
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
                                "Aprire il rubinetto lentamente"
                        ),
                        new UpdateTaskRequest.UpdateTaskStepRequest(
                                UUID.fromString("22222222-2222-2222-2222-222222222222"),
                                2,
                                "Insapona le mani",
                                "Distribuire il sapone su entrambe le mani"
                        )
                )
        );

        List<TaskAnalysisStepEntity> persistedSteps = List.of(
                step(taskId, UUID.fromString("11111111-1111-1111-1111-111111111111"), 0, "Apri l'acqua"),
                step(taskId, UUID.fromString("22222222-2222-2222-2222-222222222222"), 1, "Insapona le mani")
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskShellRepository.save(task)).thenReturn(task);
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(taskId)).thenReturn(persistedSteps);

        TaskDetailResponse response = taskDetailService.updateTask(taskId, ownerId, request);

        ArgumentCaptor<List<TaskAnalysisStepEntity>> stepsCaptor = ArgumentCaptor.forClass(List.class);
        verify(taskAnalysisStepRepository).saveAll(stepsCaptor.capture());

        List<TaskAnalysisStepEntity> savedSteps = stepsCaptor.getValue();
        assertThat(savedSteps).hasSize(2);
        assertThat(savedSteps.get(0).getPosition()).isEqualTo(0);
        assertThat(savedSteps.get(0).getTitle()).isEqualTo("Apri l'acqua");
        assertThat(savedSteps.get(1).getPosition()).isEqualTo(1);
        assertThat(savedSteps.get(1).getTitle()).isEqualTo("Insapona le mani");

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
                .containsExactly(0, 1);
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
                step(taskId, UUID.fromString("33333333-3333-3333-3333-333333333333"), 0, "Primo passo"),
                step(taskId, UUID.fromString("44444444-4444-4444-4444-444444444444"), 1, "Secondo passo")
        );

        when(taskShellRepository.findByIdAndOwnerId(taskId, ownerId)).thenReturn(Optional.of(task));
        when(taskAnalysisStepRepository.findByTaskAnalysisIdOrderByPositionAscIdAsc(eq(taskId))).thenReturn(steps);

        TaskDetailResponse response = taskDetailService.getTaskDetail(taskId, ownerId);

        assertThat(response.description()).isEqualTo("Descrizione salvata");
        assertThat(response.educationalObjective()).isEqualTo("Obiettivo salvato");
        assertThat(response.professionalNotes()).isEqualTo("Nota salvata");
        assertThat(response.contextLabel()).isEqualTo("Classe");
        assertThat(response.difficultyLevel()).isEqualTo("Base");
        assertThat(response.environmentLabel()).isEqualTo("Classe");
        assertThat(response.supportLevel()).isEqualTo("Visivo");
        assertThat(response.targetLabel()).isEqualTo("Gruppo");
        assertThat(response.steps()).extracting(TaskDetailResponse.TaskStepDetail::id)
                .containsExactly(
                        UUID.fromString("33333333-3333-3333-3333-333333333333"),
                        UUID.fromString("44444444-4444-4444-4444-444444444444")
                );
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
        return step;
    }
}
