#ifndef SERIAL_H
#define SERIAL_H

#include "qhsm.h"
class QHsmSerial {
    public:
        static void init(unsigned long baud);
        static void read();
        static void print(char value[]);
        static void print(int value);
        static void println(char value[]);
        static void println(int value);
        static bool byteReceived();
        static bool noByteReceived();
        static int lastByte;
        static unsigned long _baud;
};

// class QHsmSerial {
//     public:
//         static void init();
//         static void read();
//         static void setBaud(unsigned long baud);
//         static void print(char value[]);
//         static void print(int value);
//         static void println(char value[]);
//         static void println(int value);
//         static bool byteReceived();
//         static bool noByteReceived();
//         static int lastByte;
//         static unsigned long _baud;
// };

#endif