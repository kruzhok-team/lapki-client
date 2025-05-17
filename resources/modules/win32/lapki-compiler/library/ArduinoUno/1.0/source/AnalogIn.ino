#include "AnalogIn.h"

AnalogIn::AnalogIn(uint8_t pin){
    _pin = pin;
}

void AnalogIn::read(){
    value = analogRead(_pin);
}