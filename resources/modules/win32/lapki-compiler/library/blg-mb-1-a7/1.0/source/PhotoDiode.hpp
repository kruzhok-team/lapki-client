#pragma once
namespace detail {

    namespace PtohotoDiode {

        bool isInit = false;
    }
}

class PhotoDiode {

    bool isEvent { false };

    bool isEventSetting { false };
    uint16_t threshold{};

public:

    uint16_t value;

    PhotoDiode() {

        if (!detail::PtohotoDiode::isInit) {

            mrx::hal::photoDiode::init();

            mrx::hal::photoDiode::start();

            detail::PtohotoDiode::isInit = true;
        }
    }

    // call this function in loop()
    // not user func
    void scan() {

        value = mrx::hal::photoDiode::getSense();

        if (isEventSetting) {

            if (value > threshold) {
                isEvent = true;
            }
        }
    }

    bool isThresholdValue() {

        auto copy = isEvent;
        isEvent = false;

        return copy;
    }

    void setupEvent(const uint16_t value) {

        threshold = value;
        isEventSetting = true;
        isEvent = false;
    }
};