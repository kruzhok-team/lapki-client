#ifndef ANALOGIN_H
#define ANALOGIN_H

class AnalogIn {
    public:
        int value;
        uint8_t _pin;
        AnalogIn(uint8_t pin);
        void read();
};

#endif