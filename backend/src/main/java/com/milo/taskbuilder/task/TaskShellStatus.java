package com.milo.taskbuilder.task;

public enum TaskShellStatus {
    DRAFT("draft"),
    TEMPLATE("template");

    private final String value;

    TaskShellStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
