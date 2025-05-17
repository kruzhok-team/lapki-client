#include "AnalogOut.h"

AnalogOut::AnalogOut(uint8_t pin) {
    _pin = pin;
}

void AnalogOut::write(int value) {
    analogWrite(_pin, value);
}