#ifndef TIMER_H
#define TIMER_H

class Timer {
    
public:

    unsigned long difference;

    Timer() {

        _active = false;
        _previous = 0;
    }

    void reset() {

        _previous = millis();
    }

    void disable() {

        _active = false;
    }

    void enable() {

        _active = true;
    }

    bool timeout() {

        difference -= millis() - _previous;
        if (_active && (millis() - _previous >= _interval))
        {
            _previous = millis();
            return true;
        }
        return false;
    }

    void setInterval(unsigned long interval) {

        _interval = interval;
    }

    void start(unsigned long interval) {

        setInterval(interval);
        reset();
        enable();
        difference = interval;
    }

private:
    bool _active;
    unsigned long _previous;
    unsigned long _interval;
    bool _oneshot;
};

#endif
// TIMER_H