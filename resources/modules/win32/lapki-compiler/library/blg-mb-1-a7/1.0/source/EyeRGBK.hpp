#pragma once

#include "RgbLed.hpp"

class EyeRGBK {

public:

    // ctor
    EyeRGBK() {

        if (!detail::rgbLed::isInit) {

            // Инициализация модуля компонента
            mrx::hal::pwm::enablePWMTIM2();

            detail::rgbLed::isInit = true;
        }

        mrx::hal::rgbLed::initPin(1);
        mrx::hal::rgbLed::initPin(2);

        offRight();
        offLeft();
    }

    void setColorRight(const uint8_t red, const uint8_t green, const uint8_t blue, const uint8_t black) {

        if (!red && !green && !blue && !black)
            return;

        detail::ReservedColor1 = detail::Color{ red, green, blue, black };
        mrx::hal::rgbLed::registerPin(1, &detail::ReservedColor1);
    }

    void setColorLeft(const uint8_t red, const uint8_t green, const uint8_t blue, const uint8_t black) {

        if (!red && !green && !blue && !black)
            return;

        detail::ReservedColor2 = detail::Color{ red, green, blue, black };
        mrx::hal::rgbLed::registerPin(2, &detail::ReservedColor2);
    }

    void offRight() {

        mrx::hal::rgbLed::unregisterPin(1);
    }

    void offLeft() {

        mrx::hal::rgbLed::unregisterPin(2);
    }
};