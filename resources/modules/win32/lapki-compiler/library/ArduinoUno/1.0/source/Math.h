#ifndef MATH_H
#define MATH_H

#include <cmath>

class Math {
    float cos(float value);
    float cos(int value);
    
    float sin(float value);
    float sin(int value);
    
    int min(int lval, int rval);
    float min(float lval, float rval);
    float min(int lval, float rval);

    int max(int lval, int rval);
    float max(float lval, float rval);

    double sqrt(int val);
    float sqrt(float sqrt);

    

    int bitread(int value);
};

#endif