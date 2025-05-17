#pragma once

// Компонент для взаимодействия с общей сигнальной линией
class Alarm {

public:

    Alarm() {

        RCC -> IOPENR |= RCC_IOPENR_GPIOAEN;

        GPIO_TypeDef* const port = GPIOA;
        const uint8_t num = 4;

        port->MODER &= ~(0b11 << (GPIO_MODER_MODE0_Pos + num * 2U)); // reset pin mode
        port->MODER |= (0b01 << (GPIO_MODER_MODE0_Pos + num * 2U));  // set general purpose mode (GP output mode)
        port->OTYPER |= (0b01 << (GPIO_OTYPER_OT0_Pos + num));       // output mode pin (open drain)
        port->PUPDR &= ~(0b11 << (GPIO_PUPDR_PUPD0_Pos + num * 2U)); // no pull-up, no pull-down
        port->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + num));           // set bit on ODR

        release();
    }

    void call() {

        // OpenDrain 0 (LOW) call
        GPIOA->BSRR |= (0b01 << (GPIO_BSRR_BR0_Pos + 4));
    }

    void release() {

        // OpenDrain 1 (HIGH) release
        GPIOA->BSRR |= (0b01 << (GPIO_BSRR_BS0_Pos + 4));
    }
};