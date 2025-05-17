#pragma once

class UserSignal {

    bool state{};

public:

    UserSignal() : state(false) {}

    void call() {
        state = true;
    }

    bool isCalled() {

        bool copyState = state;
        state = false;

        return copyState;
    }
};