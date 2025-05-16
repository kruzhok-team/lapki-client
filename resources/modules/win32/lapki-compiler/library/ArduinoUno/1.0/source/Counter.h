#ifndef COUNTER_H
#define COUNTER_H

class Counter {
    public:
        Counter();
        void add(int value);
        void sub(int value);
        void set(int value);
        void reset();
        bool isEqual(int value);
        bool isLess(int value);
        bool isGreater(int value);
        int value;
};


#endif