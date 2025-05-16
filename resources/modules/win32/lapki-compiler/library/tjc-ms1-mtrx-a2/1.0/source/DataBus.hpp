#pragma once

#include "UART.hpp"     // Если не было ошибок компиляции, то после включения файла должна быть определена константа: либо UART1__, либо UART2__. Также константа UART__num

// Если UART занят другим модулем (например, SimpleBus), то ошибка компиляции (в противном случае функция-прерывание будет перезаписана текущим модулем)
#ifdef UART1_BUSY
    #error "CE: UART1 used by other hpp file (it is UB for uart interrupt function)"
#else
    #define UART1_BUSY
#endif

#ifdef UART2_BUSY
    #error "CE: UART2 used by other hpp file (it is UB for uart interrupt function)"
#else
    #define UART2_BUSY
#endif

// Компонент для низкоуровневого взаимодействия с общей шиной данных
// Шина является полудуплексной – отправку в конкретный момент времени может отсуществлять только один участник
// Использует UART1 или UART2
class DataBus {

public:

    DataBus(): DataBus(9600){}

    // ctor
    DataBus(const uint32_t baudrate) {

        detail::hal::initUART(baudrate);
        // Прикрепляем адрес переменной lastByte к модулю UART (чтобы она изменялась в функции-прерывании)
        detail::dataBusHelpers::receivedByte = &lastByte;

        detail::hal::api::isDataBusActive = true;
    }

    // Процедура отправки байта
    void sendByte(const uint8_t x) {

        // Переводим драйвер в режим передачи
        detail::hal::setReDeTransmit();

        // Отправляем байт
        detail::hal::putChar(x);

        // Переводим драйвер шины в режим приёма
        detail::hal::setReDeReceive();
    }

    // Возвращает флаг - приходил ли байт
    // Флаг сбрасывается автоматически после вызова функции
    bool isByteReceived() {

        auto oldValue = detail::dataBusHelpers::isByteReceived;
        detail::dataBusHelpers::isByteReceived = false;
        return oldValue;
    }

    uint8_t lastByte;   // Последний полученный байт

    // Возвращает последний полученный байт
    // uint8_t getLastByte() {

    //     detail::dataBusHelpers::isByteReceived = false;
    //     return detail::dataBusHelpers::receivedByte;
    // }
private:

};