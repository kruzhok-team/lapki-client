#pragma once

#include "OverflowHelpers.hpp"

using AccTypeFloating = float;
using ArgTypeFloating = float;

struct CalcFloat {

    bool overflowF;
    bool zeroDivideF;

    AccTypeFloating value;

    void set(const ArgTypeFloating value) {

        this->value = value;
    }

    void add(const ArgTypeFloating value) {

        const auto&& eval = addWithCheckOverflow(this->value, value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void sub(const ArgTypeFloating value) {

        const auto&& eval = subWithCheckOverflow(this->value, value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void mul(const ArgTypeFloating value) {

        const auto&& eval = mulWithCheckOverflow(this->value, value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void div(const ArgTypeFloating value) {

        const auto&& eval = divWithCheckOverflow(this->value, value);

        overflowF = eval.isError;
        zeroDivideF = equalFloating(value, .0);

        this->value = eval.eval;
    }

    void mod(const ArgTypeFloating value) {

        const auto&& eval = modWithCheckOverflow(this->value, value);

        overflowF = eval.isError;
        zeroDivideF = equalFloating(value, .0);

        this->value = eval.eval;
    }

    void neg() {

        this->value = -this->value;
    }

    // C has macros abs (name conflict)
    void ABS() {

        if (this->value < 0)
            neg();
    }

    void pow(const ArgTypeFloating power) {

        const auto&& eval = powWithCheckOverflow(this->value, power);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void sqrt() {

        const auto&& eval = sqrtWithCheckOverflow(this->value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void log(const ArgTypeFloating base) {

        const auto&& eval = logWithCheckOverflow(this->value, base);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    // событие на переполнение
    bool isOverflow() {

        const auto res = overflowF;
        overflowF = false;

        return res;
    }

    // событие на деление на ноль
    bool isZeroDivision() {

        const auto res = zeroDivideF;
        zeroDivideF = false;

        return res;
    }
};