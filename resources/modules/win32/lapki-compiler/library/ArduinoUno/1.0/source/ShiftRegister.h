#ifndef SHIFTREGISTER_H
#define SHIFTREGISTER_H

#define LSBFIRST 0
#define MSBFIRST 1

class ShiftRegister {
    public:
        uint8_t _dataPin;
        uint8_t _clockPin;
        uint8_t _bitOrder;
        ShiftRegister(uint8_t dataPin, uint8_t clockPin, uint8_t bitOrder);
        void shift(int value);
};


#endif