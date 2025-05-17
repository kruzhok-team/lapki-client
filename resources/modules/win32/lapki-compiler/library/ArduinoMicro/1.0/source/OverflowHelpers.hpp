#pragma once

#include <stdio.h>
#include <math.h>

int32_t MAXINT32 = 2147483646;
int32_t MININT32 = -2147483646;

// a - first operand
// b - second operand

bool isAddOverflow(const int32_t a, const int32_t b) {

    if (b > 0 && a > MAXINT32 - b)
        return true;    // overflow
    
    if (b < 0 && a < MININT32 - b)
        return true;    // underflow

    return false;
}

bool isSubOverflow(const int32_t a, const int32_t b) {

    if (b < 0 && a > MAXINT32 + b)
        return true;    // overflow
    
    if (b > 0 && a < MININT32 + b)
        return true;    // underflow

    return false;
}

bool isMulOverflow(const int32_t a, const int32_t b) {

    if (a == -1 && b == MININT32)
        return true;    // overflow

    if (a == MININT32 && b == -1)
        return true;    // overflow

    if (b > 0 && a > MAXINT32 / b)
        return true;    // overflow
    
    if (b < 0 && a > MININT32 / b)
        return true;    // underflow

    return false;
}

bool isDivOverflow(const int32_t a, const int32_t b) {

    if (a == MININT32 && b == -1)
        return true;    // overflow

    return false;
}

#define EPSILON 0.00001

struct pair {

    bool isError;
    double eval;
};

bool equalFloating(const double a, const double b) {
    
    return fabs(a - b) < EPSILON;
}

// true if value is valid
bool isValid(const double value) {

    return !isinf(value) && !isnan(value);
}

// a - first operand
// b - second operand

pair addWithCheckOverflow(const double a, const double b) {

    const auto&& eval = a + b;

    return pair { !isValid(eval), eval };
}

pair subWithCheckOverflow(const double a, const double b) {

    const auto&& eval = a - b;

    return pair { !isValid(eval), eval };
}

pair mulWithCheckOverflow(const double a, const double b) {

    const auto&& eval = a * b;

    return pair { !isValid(eval), eval };
}

pair divWithCheckOverflow(const double a, const double b) {

    if (equalFloating(b, .0))
        return pair { false, INFINITY };

    const auto&& eval = a / b;

    return pair { !isValid(eval), eval };
}

pair modWithCheckOverflow(const double a, const double b) {

    if (equalFloating(b, .0))
        return pair { false, INFINITY };

    const auto&& eval = fmod(a, b);

    return pair { !isValid(eval), eval };
}            

pair powWithCheckOverflow(const double a, const double b) {

    const auto&& eval = pow(a, b);

    return pair { !isValid(eval), eval };
}

pair sqrtWithCheckOverflow(const double a) {

    const auto&& eval = sqrt(a);

    return pair { !isValid(eval), eval };
}

pair logWithCheckOverflow(const double a, const double b) {

    // b -> base of log
    const auto&& eval = log(a) / log(b);

    return pair { !isValid(eval), eval };
}