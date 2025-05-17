#include "QHsmSerial.h"


unsigned long QHsmSerial::_baud = 9600;
int QHsmSerial::lastByte = -1;

bool QHsmSerial::byteReceived(){
  return QHsmSerial::lastByte != -1; 
};

bool QHsmSerial::noByteReceived(){
  return QHsmSerial::lastByte == -1; 
};

void QHsmSerial::read(){
  QHsmSerial::lastByte = Serial.read();
};

void QHsmSerial::print(char msg[]){
  Serial.print(msg);
};

void QHsmSerial::print(int msg){
  Serial.print(msg);
};

void QHsmSerial::println(char msg[]){
  Serial.println(msg);
};

void QHsmSerial::println(int msg){
  Serial.println(msg);
};


void QHsmSerial::init(unsigned long baud){
  QHsmSerial::_baud = baud;
  QHsmSerial::lastByte = -1;
  Serial.begin(_baud);
};