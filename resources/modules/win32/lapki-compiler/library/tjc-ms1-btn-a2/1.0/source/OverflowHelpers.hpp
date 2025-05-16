#pragma once

#include <limits>
#include <numeric>
#include <cmath>
#include <cstdint>

namespace detail {

    namespace helpers {

        namespace integer {

            // a - first operand
            // b - second operand

            using ArgType = int32_t;

            bool isAddOverflow(const ArgType a, const ArgType b) {

                if (b > 0 && a > std::numeric_limits<ArgType>::max() - b)
                    return true;    // overflow
                
                if (b < 0 && a < std::numeric_limits<ArgType>::min() - b)
                    return true;    // underflow

                return false;
            }

            bool isSubOverflow(const ArgType a, const ArgType b) {

                if (b < 0 && a > std::numeric_limits<ArgType>::max() + b)
                    return true;    // overflow
                
                if (b > 0 && a < std::numeric_limits<ArgType>::min() + b)
                    return true;    // underflow

                return false;
            }

            bool isMulOverflow(const ArgType a, const ArgType b) {

                if (a == -1 && b == std::numeric_limits<ArgType>::min())
                    return true;    // overflow

                if (a == std::numeric_limits<ArgType>::min() && b == -1)
                    return true;    // overflow

                if (b > 0 && a > std::numeric_limits<ArgType>::max() / b)
                    return true;    // overflow
                
                if (b < 0 && a > std::numeric_limits<ArgType>::min() / b)
                    return true;    // underflow

                return false;
            }

            bool isDivOverflow(const ArgType a, const ArgType b) {

                if (a == std::numeric_limits<ArgType>::min() && b == -1)
                    return true;    // overflow

                return false;
            }
        }

        namespace floating {

            using ArgType = float;

            #define EPSILON 0.00001

            struct pair {

                bool isError{};
                ArgType eval{};
            };

            bool equalFloating(const ArgType a, const ArgType b) {
                
                return fabs(a - b) < EPSILON;
            }

            // true if value is valid
            bool isValid(const ArgType value) {

                return !std::isinf(value) && !std::isnan(value) && std::numeric_limits<ArgType>::is_iec559;
            }

            // a - first operand
            // b - second operand

            pair addWithCheckOverflow(const ArgType a, const ArgType b) {

                const auto&& eval = a + b;

                return { !isValid(eval), eval };
            }

            pair subWithCheckOverflow(const ArgType a, const ArgType b) {

                const auto&& eval = a - b;

                return { !isValid(eval), eval };
            }

            pair mulWithCheckOverflow(const ArgType a, const ArgType b) {

                const auto&& eval = a * b;

                return { !isValid(eval), eval };
            }

            pair divWithCheckOverflow(const ArgType a, const ArgType b) {

                if (equalFloating(b, .0))
                    return { false, std::numeric_limits<ArgType>::infinity() };

                const auto&& eval = a / b;

                return { !isValid(eval), eval };
            }

            pair modWithCheckOverflow(const ArgType a, const ArgType b) {

                if (equalFloating(b, .0))
                    return { false, std::numeric_limits<ArgType>::infinity() };

                const auto&& eval = std::fmod(a, b);

                return { !isValid(eval), eval };
            }            

            pair powWithCheckOverflow(const ArgType a, const ArgType b) {

                const auto&& eval = std::pow(a, b);

                return { !isValid(eval), eval };
            }

            pair sqrtWithCheckOverflow(const ArgType a) {

                const auto&& eval = std::sqrt(a);

                return { !isValid(eval), eval };
            }

            pair logWithCheckOverflow(const ArgType a, const ArgType b) {

                // b -> base of log
                const auto&& eval = std::log(a) / std::log(b);

                return { !isValid(eval), eval };
            }
        }
    }
}

// https://stackoverflow.com/questions/15655070/how-to-detect-double-precision-floating-point-overflow-and-underflow
// https://stackoverflow.com/questions/570669/checking-if-a-double-or-float-is-nan-in-c
// https://stackoverflow.com/questions/42926763/the-behaviour-of-floating-point-division-by-zero

// log -> https://ru.stackoverflow.com/questions/1543830/%D0%9F%D0%BE%D1%87%D0%B5%D0%BC%D1%83-%D1%83-stdlog-%D0%B2-%D1%81-%D1%82%D0%BE%D0%BB%D1%8C%D0%BA%D0%BE-%D0%BE%D0%B4%D0%B8%D0%BD-%D0%B0%D1%80%D0%B3%D1%83%D0%BC%D0%B5%D0%BD%D1%82