#pragma once

#include "PWMHelpers.hpp"

// Связка для хала и компнента ШИМ

namespace connector {

    int16_t isPwmPin(const uint8_t pin) {

        if (pin < 1 || pin > mrx::hal::pwm::pinQuantity)
            return -1;

        return pin;
    }
}