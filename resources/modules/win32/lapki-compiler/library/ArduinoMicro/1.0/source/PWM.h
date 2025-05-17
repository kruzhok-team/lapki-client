#ifndef PWM_H
#define PWM_H

class PWM {
    protected:
        uint8_t _pin;
    public:
        PWM(uint8_t pin);
        void write(int value);
        void PWMtone(unsigned int frequency, unsigned long duration);
};

#endif