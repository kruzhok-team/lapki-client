#pragma once

namespace detail {

    namespace random {
                
        const uint32_t RAND_A { 1103515245 };
        const uint32_t RAND_C { 12345 };
        const uint32_t RAND_M { 2147483648 };

        bool isSeeded { false };

        uint32_t seed{};

        uint32_t random() {

            if (!isSeeded) {

                seed = mrx::hal::random::mkSeed();
                isSeeded = true;
            }

            seed = ( RAND_A * seed + RAND_C ) % RAND_M;

            return seed;
        }
    }
}

// Компонент для генерации псевдо-случайного числа. Seed задается при помощи отсчета времени
class Random {

    uint32_t abs(int32_t x) {

        if (x < 0)
            return -x;

        return x;
    }
    
public:

    /* Снимаемые значения: знаковое и беззнаковое */
    uint32_t uValue;
    int32_t value;

    Random() {}

    void setSeed(const uint32_t seed) {
        
        detail::random::seed = seed;
        detail::random::isSeeded = true;
    }

    // Устанавливает новое случайное значение в value и uValue
    void doRandom() {

        const auto oldRandomValue = detail::random::seed;
        const auto randomValue = detail::random::random();

        // put to value fields
        value = randomValue;
        uValue = randomValue;

        // random sign for value
        if ((oldRandomValue &1) == 0) {
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