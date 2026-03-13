package com.milo.taskbuilder.task;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class TaskShellVisibilityConverter implements AttributeConverter<TaskShellVisibility, String> {

    @Override
    public String convertToDatabaseColumn(TaskShellVisibility attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public TaskShellVisibility convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "private" -> TaskShellVisibility.PRIVATE;
            case "template" -> TaskShellVisibility.TEMPLATE;
            default -> throw new IllegalArgumentException("Unsupported task shell visibility: " + dbData);
        };
    }
}
