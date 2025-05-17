#pragma once

#include "PWM.hpp"

class LED {

private:
    uint8_t map(uint8_t x, uint8_t in_min, uint8_t in_max, uint8_t out_min, uint8_t out_max) {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

public:
    LED(uint8_t ledPin) {

        pin = ledPin + 4;   // map from user pin to stm32 pin {1,2,3} -> {5, 6, 7}

        RCC -> IOPENR |= RCC_IOPENR_GPIOAEN; // тактирование

        GPIOA->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + pin * 2U)); // reset pin mode
        GPIOA->MODER |= (0b01 << (GPIO_MODER_MODE0_Pos + pin * 2U));  // set general purpose mode (GP output mode)
        GPIOA->OTYPER &= ~(GPIO_OTYPER_OT0 << pin);       // output mode pin (PP)
        GPIOA->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + pin * 2U)); // no pull-up, no pull-down
        GPIOA->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + pin));           // set bit on ODR

        value = 0;
        off();
    }

    bool getState() {

        return value;
    }

    void on(const uint8_t brightness = 100) {

        // change state
        value = 1;

        // Если на всю яркость - все просто
        if (brightness == 100) {
            GPIOA->BSRR |= ( GPIO_BSRR_BS0 << pin );
            return;
        }

        // Если яркость == 0, то выключаем светодиод (меняем состояние класса)
        if (brightness == 0) {
            off();
            return;
        }

        // Иначе подключаем ШИМ

        // mapping [0.255] -> [0..100]
        const uint8_t val = brightness; //const uint8_t val = map(brightness, 0, 255, 0, 100);
        
        PWM().write(val, pin -4);
    }

    void off() {

        GPIOA->BSRR |= ( GPIO_BSRR_BR0 << pin );
        value = 0;

        // Выключаем ШИМ, если включение было через него
        PWM().write(0, pin -4);
    }

    void toggle() {

        value ? off() : on();
    }

    void blink(unsigned int time, byte times = 1) {

        for (byte i = 0; i < times; i++)
        {
            toggle();
            delay(time / 2);
            toggle();
            delay(time / 2);
        }
    }

    void setValue(byte val) {

        value = (val <= 127) ? 0 : 1;
        toggle();
        toggle();
    }

    void fadeIn(unsigned int time) {

        return;
    }

    void fadeOut(unsigned int time) {

        return;
    }

    bool value;

private:
    uint8_t pin;
};