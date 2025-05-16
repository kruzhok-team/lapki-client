#pragma once

// #include <cstdint>

#include "OverflowHelpers.hpp"

typedef int32_t AccType;
typedef int32_t ArgType;

struct CalcInt {

    bool overflowF;
    bool zeroDivideF;

    AccType value;

    void set(const ArgType value) {

        this->value = value;
    }

    void add(const ArgType value) {

        overflowF = isAddOverflow(this->value, value);

        this->value += value;
    }

    void sub(const ArgType value) {

        overflowF = isSubOverflow(this->value, value);

        this->value -= value;
    }

    void mul(const ArgType value) {

        overflowF = isMulOverflow(this->value, value);

        this->value *= value;
    }

    void div(const ArgType value) {

        zeroDivideF = (value == 0);
        overflowF = isDivOverflow(this->value, value);

        if (!zeroDivideF)
            this->value /= value;
    }

    void mod(const ArgType value) {

        zeroDivideF = (value == 0);

        if (!zeroDivideF)
            this->value %= value;
    }

    void neg() {

        this->value = -this->value;
    }

    // C has macros abs (name conflict)
    void ABS() {

        if (this->value < 0)
            neg();
    }

    void bitAnd(const ArgType value) {

        this->value &= value;
    }

    void bitOr(const ArgType value) {

        this->value |= value;
    }

    void bitXor(const ArgType value) {

        this->value ^= value;
    }

    void bitNot() {

        this->value = ~this->value;
    }

    void shiftLeft(const ArgType value) {

        this->value = this->value << value;
    }

    void shiftRight(const ArgType value) {

        this->value = this->value >> value;
    }

    // события на переполнение и деление на ноль?
    bool isOverflow() {

        const auto res = overflowF;
        overflowF = false;

        return res;
    }

    bool isZeroDivision() {

        const auto res = zeroDivideF;
        zeroDivideF = false;

        return res;
    }
};