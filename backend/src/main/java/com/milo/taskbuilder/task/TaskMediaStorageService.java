package com.milo.taskbuilder.task;

import com.milo.taskbuilder.task.dto.TaskMediaUploadResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class TaskMediaStorageService {

    private static final Set<String> SUPPORTED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final long MAX_UPLOAD_BYTES = 5L * 1024L * 1024L;
    private static final String STORAGE_PROVIDER = "filesystem";
    private static final String STORAGE_BUCKET = "task-step-media";

    private final TaskShellRepository taskShellRepository;
    private final TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository;
    private final Path storageRoot;

    public TaskMediaStorageService(
            TaskShellRepository taskShellRepository,
            TaskAnalysisStepMediaRepository taskAnalysisStepMediaRepository
    ) {
        this.taskShellRepository = taskShellRepository;
        this.taskAnalysisStepMediaRepository = taskAnalysisStepMediaRepository;
        this.storageRoot = Paths.get(System.getProperty("java.io.tmpdir"), "milo-taskbuilder-media");
    }

    @Transactional
    public TaskMediaUploadResponse upload(UUID taskId, UUID ownerId, MultipartFile file) {
        ensureOwnedTask(taskId, ownerId);
        validateFile(file);

        byte[] bytes = readBytes(file);
        BufferedImage image = readImage(bytes);
        String storageKey = taskId + "/" + UUID.randomUUID() + extension(file.getOriginalFilename(), file.getContentType());
        Path target = storageRoot.resolve(STORAGE_BUCKET).resolve(storageKey);

        writeFile(target, bytes);

        TaskAnalysisStepMediaEntity media = new TaskAnalysisStepMediaEntity();
        media.setTaskAnalysisId(taskId);
        media.setKind("image");
        media.setStorageProvider(STORAGE_PROVIDER);
        media.setStorageBucket(STORAGE_BUCKET);
        media.setStorageKey(storageKey);
        media.setFileName(normalizeFileName(file.getOriginalFilename()));
        media.setMimeType(file.getContentType());
        media.setFileSizeBytes(bytes.length);
        media.setWidth(image.getWidth());
        media.setHeight(image.getHeight());

        TaskAnalysisStepMediaEntity savedMedia = taskAnalysisStepMediaRepository.save(media);
        return new TaskMediaUploadResponse(
                savedMedia.getId(),
                taskId,
                savedMedia.getFileName(),
                savedMedia.getMimeType(),
                savedMedia.getFileSizeBytes(),
                savedMedia.getWidth(),
                savedMedia.getHeight(),
                savedMedia.getStorageKey(),
                savedMedia.getAltText(),
                buildAccessUrl(taskId, savedMedia.getId())
        );
    }

    @Transactional(readOnly = true)
    public StoredTaskMediaContent loadOwnedMedia(UUID taskId, UUID mediaId, UUID ownerId) {
        ensureOwnedTask(taskId, ownerId);
        TaskAnalysisStepMediaEntity media = taskAnalysisStepMediaRepository.findByIdAndTaskAnalysisId(mediaId, taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media not found"));

        Path source = storageRoot.resolve(media.getStorageBucket()).resolve(media.getStorageKey());
        if (!Files.exists(source)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stored media file not found");
        }

        try {
            return new StoredTaskMediaContent(Files.readAllBytes(source), media.getMimeType(), media.getFileName());
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read stored media", exception);
        }
    }

    public String buildAccessUrl(UUID taskId, UUID mediaId) {
        return "/api/tasks/%s/media/%s/content".formatted(taskId, mediaId);
    }

    private void ensureOwnedTask(UUID taskId, UUID ownerId) {
        taskShellRepository.findByIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is required");
        }
        if (!SUPPORTED_MIME_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported media type");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file exceeds the 5 MB limit");
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read uploaded file", exception);
        }
    }

    private BufferedImage readImage(byte[] bytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is not a readable image");
            }
            return image;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is not a readable image", exception);
        }
    }

    private void writeFile(Path target, byte[] bytes) {
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store uploaded file", exception);
        }
    }

    private String extension(String fileName, String contentType) {
        String normalizedName = normalizeFileName(fileName);
        if (normalizedName != null) {
            int dotIndex = normalizedName.lastIndexOf('.');
            if (dotIndex >= 0) {
                return normalizedName.substring(dotIndex);
            }
        }
        return switch (contentType == null ? "" : contentType.toLowerCase(Locale.ROOT)) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private String normalizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return null;
        }
        return Path.of(fileName).getFileName().toString().trim();
    }

    public record StoredTaskMediaContent(
            byte[] bytes,
            String mimeType,
            String fileName
    ) {
    }
}
