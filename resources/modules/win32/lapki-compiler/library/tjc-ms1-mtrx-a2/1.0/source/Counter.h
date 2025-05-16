#ifndef COUNTER_H
#define COUNTER_H

class Counter {
    public:
        Counter() {
            value = 0;
        }

        void add(int value) {
            this->value += value;
        }

        void sub(int value) {
            this->value -= value;
        }

        void set(int value) {
            this->value = value;
        }

        void reset() {
            this->value = 0;
        }

        //Signals
        bool isEqual(int value) {
            return this->value == value;
        }

        bool isLess(int value) {
            return this->value < value;
        }

        bool isGreater(int value) {
            return this->value > value;
        }

        int value;
};


#endif