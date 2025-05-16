#pragma once

#include "RgbLed.hpp"

class EyePalette {

public:

    // ctor
    EyePalette() {

        if (!detail::rgbLed::isInit) {

            // Инициализация модуля компонента
            mrx::hal::pwm::enablePWMTIM2();

            detail::rgbLed::isInit = true;
        }

        mrx::hal::rgbLed::initPin(1);
        mrx::hal::rgbLed::initPin(2);

        setColorPaletteRight(&ColorBlack);
        setColorPaletteLeft(&ColorBlack);
    }

    void setColorPaletteRight(detail::Color* color) {

        if (color == &ColorBlack) {

            mrx::hal::rgbLed::unregisterPin(1);
        }

        mrx::hal::rgbLed::registerPin(1, color);
    }

    void setColorPaletteLeft(detail::Color* color) {

        if (color == &ColorBlack) {

            mrx::hal::rgbLed::unregisterPin(2);
        }

        mrx::hal::rgbLed::registerPin(2, color);
    }
};