#pragma once

class AlarmListener {

public:

    AlarmListener() {

        RCC -> IOPENR |= RCC_IOPENR_GPIOAEN; // тактирование

        // init for read mode
        GPIOA->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + 4 * 2U)); // no pull-up, no pull-down
        GPIOA->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + 4 * 2U)); // reset power mode
    }

    bool onAlarm() {

        return !((GPIOA->IDR >> 4) & 0x01);
    }
};