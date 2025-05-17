#include "PWM.h"

PWM::PWM(uint8_t pin){
    _pin = pin;
}

void PWM::write(int value){ 
    analogWrite(_pin, value);
}

void PWM::PWMtone(unsigned int frequency, unsigned long duration){
    tone(_pin, frequency, duration);
}