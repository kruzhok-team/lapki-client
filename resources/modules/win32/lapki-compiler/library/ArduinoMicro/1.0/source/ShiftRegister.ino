#include "ShiftRegister.h"

ShiftRegister::ShiftRegister(uint8_t dataPin, uint8_t clockPin, uint8_t bitOrder) {
    _dataPin = dataPin;
    _clockPin = clockPin;
    _bitOrder = bitOrder;
}

void ShiftRegister::shift(int value){
    while(value > 255) {
        shiftOut(_dataPin, _clockPin, _bitOrder, (value >> 8));
    }
    shiftOut(_dataPin, _clockPin, _bitOrder, value);
}