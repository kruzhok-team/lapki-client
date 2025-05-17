#pragma once

#include <cstdint>

#include "OverflowHelpers.hpp"

using AccType = int32_t;
using ArgType = int32_t;

class CalcInt {

    bool overflowF {false};
    bool zeroDivideF {false};

public:

    AccType value{};

    void set(const ArgType value) {

        this->value = value;
    }

    void add(const ArgType value) {

        overflowF = detail::helpers::integer::isAddOverflow(this->value, value);

        this->value += value;
    }

    void sub(const ArgType value) {

        overflowF = detail::helpers::integer::isSubOverflow(this->value, value);

        this->value -= value;
    }

    void mul(const ArgType value) {

        overflowF = detail::helpers::integer::isMulOverflow(this->value, value);

        this->value *= value;
    }

    void div(const ArgType value) {

        zeroDivideF = (value == 0);
        overflowF = detail::helpers::integer::isDivOverflow(this->value, value);

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

    void abs() {

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