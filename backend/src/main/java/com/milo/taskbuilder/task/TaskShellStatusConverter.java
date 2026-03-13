package com.milo.taskbuilder.task;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TaskShellStatusConverter implements AttributeConverter<TaskShellStatus, String> {

    @Override
    public String convertToDatabaseColumn(TaskShellStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public TaskShellStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "draft" -> TaskShellStatus.DRAFT;
            case "template" -> TaskShellStatus.TEMPLATE;
            default -> throw new IllegalArgumentException("Unsupported task shell status: " + dbData);
        };
    }
}
