#pragma once

#include "Servo.h"

// https://docs.arduino.cc/libraries/servo/
struct ServoWrapper {

    Servo s;

    uint16_t angle;
    uint16_t angleMicroseconds;

    ServoWrapper(uint8_t pin, uint16_t min = 544, uint16_t max = 2400) {

        s.attach(pin, min, max);
    }

    void write(int16_t angle) {
        s.write(angle);

        this->angle = angle;
        this->angleMicroseconds = s.readMicroseconds();
    }

    void writeMicroseconds(int32_t us) {
        s.writeMicroseconds(us);
        
        this->angle = s.read();
        this->angleMicroseconds = us;
    }
};