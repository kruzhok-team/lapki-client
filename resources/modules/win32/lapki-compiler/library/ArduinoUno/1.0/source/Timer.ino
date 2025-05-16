/* $Id: Timer.cpp 1198 2011-06-14 21:08:27Z bhagman $
||
|| @author         Alexander Brevig <abrevig@wiring.org.co>
|| @url            http://wiring.org.co/
|| @url            http://alexanderbrevig.com/
|| @contribution   Brett Hagman <bhagman@wiring.org.co>
||
|| @description
|| | Provides an easy way of triggering functions at a set interval.
|| |
|| | Wiring Cross-platform Library
|| #
||
|| @license Please see cores/Common/License.txt.
||
*/

#include "Timer.h"
/*
|| @constructor
|| | Initialize the Timer object and activate it
|| #
||
|| @parameter intervl  the interval to call the function
|| @parameter qhsm     the statemachine, that will receive signals by timeout
|| @parameter oneshot  if true, the timer will be disabled after the timeout
|| @parameter signal   signal, that will be emmited by timeout
*/
Timer::Timer()
{
  _active = false;
  _previous = 0;
}

void Timer::reset()
{
  _previous = millis();
}

/*
|| @description
|| | Disable the calling of this Timer
|| #
*/
void Timer::disable()
{
  _active = false;
}

/*
|| @description
|| | Enable the calling of this Timer
|| #
*/
void Timer::enable()
{
  _active = true;
}

/*
|| @description
|| | Check if it is time for this Timer to call the function
|| #
*/
bool Timer::timeout()
{
  difference -= millis() - _previous;
  if (_active && (millis() - _previous >= _interval))
  {
    _previous = millis();
    return true;
  }
  return false;
}

/*
|| @description
|| | Set the interval of this Timer
|| #
||
|| @parameter intervl the interval to call the function
*/
void Timer::setInterval(unsigned long intervl)
{
  _interval = intervl;
}

void Timer::start(unsigned long interval)
{
  setInterval(interval);
  reset();
  enable();
  difference = interval;
}