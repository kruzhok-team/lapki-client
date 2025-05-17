#pragma once

class Iterator {

    int32_t from{}, to{}, step{};
    bool isActive{};

    bool isFirst{};

public:

    int32_t index{};

    Iterator() {}

    void start(int32_t from, int32_t to, int32_t step) {

        this->from = from;
        this->to = to;
        this->step = step;

        index = from;
        if (index >= to) {
            isActive = false;
        } else {
            isActive = true;
            isFirst = true;
        }
    }

    void stop() {

        isActive = false;
    }

    bool onIteration() {

        if (isActive) {
            if (isFirst) {
                isFirst = false;
                return isActive;
            }

            index += step;
            if (index >= to) {
                isActive = false;
            }
        }

        return isActive;
    }

    bool onEnd() {

        return !isActive;
    }
};