#pragma once

#include "PWM.hpp"

class LED {

    uint8_t map(uint8_t x, uint8_t in_min, uint8_t in_max, uint8_t out_min, uint8_t out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

public:
    LED(){}

    LED(const uint8_t ledPin) {
        pin = ledPin;

        if (pin < mrx::hal::led::minPin || pin > mrx::hal::led::maxPin)
            pin = mrx::hal::led::minPin;

        mrx::hal::led::initPin(pin);
        value = 0;
        off();
    }

    bool getState() const {

        return value;
    }

    void on(uint8_t brightness = 100) {

        // Отключаем ШИМ, если вдруг он использовался ранее
        off();

        // Если яркость == 0, то выключаем светодиод (меняем состояние класса) (выключили выше)
        if (brightness == 0) {
            return;
        }
        
        value = 1;  // change state

        // Если на всю яркость - все просто
        if (brightness >= 100) {
            mrx::hal::led::onPin(pin);
            return;
        }

        // Иначе подключаем ШИМ
        
        if (brightness > 100)
            // Фиксим диапазон, если пользователь указал больше (скорее всего он думал, что диапазон [0..255])
            brightness = map(brightness, 0, 255, 0, 100);
        
        PWM().write(brightness, pin);
    }

    void off() {

        mrx::hal::led::offPin(pin);
        value = 0;

        // Выключаем ШИМ, если включение было через него
        PWM().write(0, pin);
    }

    void toggle() {

        value ? off() : on();
    }

    void blink(unsigned int time, const uint8_t times = 1) {

        for (uint8_t i = 0; i < times; i++)
        {
            toggle();
            delay(time / 2);
            toggle();
            delay(time / 2);
        }
    }

    uint8_t getBrightness() {

        const auto&& brightness = PWM().getLevel(pin);
        
        // case: when brightness led == 100, PWM off!
        if (!brightness && value) {
            return 100;
        }

        return brightness;
    }

    bool value;

private:
    uint8_t pin;
};