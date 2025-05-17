#include "Counter.h"

Counter::Counter(){
    value = 0;
}

void Counter::add(int value){
    this->value += value;
}

void Counter::sub(int value){
    this->value -= value;
}

void Counter::set(int value){
    this->value = value;
}

void Counter::reset(){
    this->value = 0;
}


//Signals
bool Counter::isEqual(int value){
    return this->value == value;
}

bool Counter::isLess(int value){
    return this->value < value;
}

bool Counter::isGreater(int value){
    return this->value > value;
}