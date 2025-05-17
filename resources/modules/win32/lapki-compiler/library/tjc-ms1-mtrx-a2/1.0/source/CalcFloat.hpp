#pragma once

#include "OverflowHelpers.hpp"

using AccTypeFloating = float;
using ArgTypeFloating = float;

class CalcFloat {

    bool overflowF {false};
    bool zeroDivideF {false};

public:

    AccTypeFloating value{};

    void set(const ArgTypeFloating value) {

        this->value = value;
    }

    void add(const ArgTypeFloating value) {

        const auto&& eval = detail::helpers::floating::addWithCheckOverflow(this->value, value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void sub(const ArgTypeFloating value) {

        const auto&& eval = detail::helpers::floating::subWithCheckOverflow(this->value, value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void mul(const ArgTypeFloating value) {

        const auto&& eval = detail::helpers::floating::mulWithCheckOverflow(this->value, value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void div(const ArgTypeFloating value) {

        const auto&& eval = detail::helpers::floating::divWithCheckOverflow(this->value, value);

        overflowF = eval.isError;
        zeroDivideF = detail::helpers::floating::equalFloating(value, .0);

        this->value = eval.eval;
    }

    void mod(const ArgTypeFloating value) {

        const auto&& eval = detail::helpers::floating::modWithCheckOverflow(this->value, value);

        overflowF = eval.isError;
        zeroDivideF = detail::helpers::floating::equalFloating(value, .0);

        this->value = eval.eval;
    }

    void neg() {

        this->value = -this->value;
    }

    void abs() {

        if (this->value < 0)
            neg();
    }

    void pow(const ArgTypeFloating power) {

        const auto&& eval = detail::helpers::floating::powWithCheckOverflow(this->value, power);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void sqrt() {

        const auto&& eval = detail::helpers::floating::sqrtWithCheckOverflow(this->value);

        overflowF = eval.isError;

        this->value = eval.eval;
    }

    void log(const ArgTypeFloating base) {

        const auto&& eval = detail::helpers::floating::logWithCheckOverflow(this->value, base);

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