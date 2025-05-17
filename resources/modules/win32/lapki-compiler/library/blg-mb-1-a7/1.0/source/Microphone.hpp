#pragma once

namespace detail {

    namespace microphone {

        bool isInit = false;
    }
}

class Microphone {

    uint16_t lValue{}, rValue{};

    bool isEvent { false };

    bool isEventSetting { false };
    uint16_t threshold{};

public:

    // ctor
    Microphone() {

        if (!detail::microphone::isInit) {

            mrx::hal::microphone::api::init();

            mrx::hal::microphone::detail::initDetector();

            detail::microphone::isInit = true;
        }
    }

    void scan () {

        senseLeft();
        senseRight();
    }

    bool isLoudSound() {

        if (mrx::hal::microphone::detectedLevel > threshold) {

            isEvent = true;
        }

        auto copy = isEvent;
        isEvent = false;

        if (copy) {
            mrx::hal::microphone::detail::resetDetector();
        }

        return copy;
    }

    void setupEvent(const uint16_t value) {

        threshold = value;
        isEvent = false;

        mrx::hal::microphone::detail::resetDetector();
        mrx::hal::microphone::detail::enableDetector(true);
        // isEventSetting = true;
    }

    // not user functions

    void senseLeft() {
        lValue = mrx::hal::microphone::api::senseLeft();
    }

    void senseRight() {
        rValue = mrx::hal::microphone::api::senseRight();
    }
};