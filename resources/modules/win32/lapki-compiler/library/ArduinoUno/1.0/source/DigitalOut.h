#ifndef DIGITALOUT_H
#define DIGITALOUT_H

class DigitalOut {
    public:
        DigitalOut(uint8_t _pin);
        void low();
        void high();
        void init();
        void toggle();

        uint8_t pin;
        uint8_t value;
};

#endif