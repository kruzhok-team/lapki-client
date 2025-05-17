#pragma once

// https://habr.com/ru/companies/vk/articles/574414/
// https://ru.wikipedia.org/wiki/Xorshift

struct stateRandom {
    uint32_t a, b, c, d;
};

// Компонент для генерации псевдо-случайного числа. Seed задается при помощи отсчета времени
class Random {

    stateRandom state{1, 2, 3, 4};

    uint32_t abs(int32_t x) {

        if (x < 0)
            return -x;

        return x;
    }

public:

    Random() {
        state.a = millis();
    }

    void setSeed(const uint32_t seed) {
        
        state = stateRandom{seed, 2, 3, 4};
    }

    /* Снимаемые значения: знаковое и беззнаковое */
    uint32_t uValue;
    int32_t value;

    // Устанавливает новое случайное значение в value и uValue
    void doRandom() {

        uint32_t t = state.d;
        t ^= t << 11;
        t ^= t >> 8;

        // shift states
        state.d = state.c;
        state.c = state.b;
        state.b = state.a;

        const uint32_t s = state.a;
        state.a = t ^ s ^ (s >> 19);

        // put to value fields
        value = state.a;
        uValue = value;
        if ((s &1) == 0) {
            value = - value;
        }

        return;
    }

    // doRandom для заданного диапазона [begin; end)
    void doRangeRandom(const int64_t begin, const int64_t end) {

        doRandom();

        // Для знакового
        if (value < begin || value >= end) {
            // От начала нашего диапазона добавляем допустимые пределы разброса
            value = begin + (abs(value) % (end - begin));
        }

        // Для беззнакового
        if (uValue < begin || uValue >= end) {

            auto _begin = begin;
            if (_begin < 0)
                _begin = 0;

            auto _end = end;
            if (_end < _begin)
                _end = _begin + 1;

            // x - допустимые пределы разброса для случайного значения
            const auto x = _end - _begin;
            uValue = begin + (uValue % x);
        }

        return;
    }
};