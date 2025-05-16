#ifndef DIGITALIN_H
#define DIGITALIN_H

class DigitalIn {
    public:
        uint8_t _pin;
        int _oldValue;
        int value;
        DigitalIn(uint8_t pin);
        bool isChanged();
        bool isHigh();
        bool isLow();
};

#endif