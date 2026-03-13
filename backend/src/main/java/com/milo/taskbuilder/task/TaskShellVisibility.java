package com.milo.taskbuilder.task;

public enum TaskShellVisibility {
    PRIVATE("private"),
    TEMPLATE("template");

    private final String value;

    TaskShellVisibility(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
