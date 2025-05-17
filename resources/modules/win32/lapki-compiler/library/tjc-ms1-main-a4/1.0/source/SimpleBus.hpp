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

namespace detail {

    namespace helpers {

        uint8_t byteToAsci(const uint8_t value) {

            if (value < 10) {
                return value + 48;
            }
            else {
                return value + 55;
            }
        }

        uint16_t addrToAsci(const uint8_t addr) {

            uint8_t left = (addr >> 4) & 0x0F;  // старший разряд байта
            uint8_t right = addr & 0x0F;        // младший разряд байта

            uint8_t leftA = byteToAsci(left);            // Перевели в аски
            uint8_t rightA = byteToAsci(right);          // Перевели в аски

            return (uint16_t(leftA) << 8) | rightA;
        }
    }
}

// Компонент для базового взаимодействия с общей шиной данных на основе простого протокола
// Шина является полудуплексной – отправку в конкретный момент времени может отсуществлять только один участник
// Использует UART1 или UART2
/*
    Структура пакета для протокола SimpleBus:

    [CR] [addr1] [addr2] [data] [LF]

        [addr1] – старший полу-байт адреса в HEX-представлении
        [addr2] – младший полу-байт адреса в HEX-представлении
        [data] – символ полезной нагрузки
        [CR] [LF] – соответствующие управляющие символы
*/
class SimpleBus {

public:

    uint8_t myAddress, lastData;

    // ctor
    SimpleBus() {

        detail::hal::initUART(9600);

        detail::hal::api::isSimpleBusActive = true;
    }

    void setAddress(const uint8_t addr) {

        myAddress = addr;
        detail::simpleBusHelpers::addr = addr;
        detail::simpleBusHelpers::addrAsci = detail::helpers::addrToAsci(addr);
    }

    void sendPacket(const uint8_t addr, const uint8_t data) {

        uint16_t addrAsci = detail::helpers::addrToAsci(addr);

        // Переводим драйвер в режим передачи
        detail::hal::setReDeTransmit();

        detail::hal::putChar(detail::constants::CR);

        detail::hal::putChar((addrAsci >> 8) & 0xFF);
        detail::hal::putChar(addrAsci & 0xFF);

        detail::hal::putChar(data);

        detail::hal::putChar(detail::constants::LF);
        
        // Переводим драйвер шины в режим приёма
        detail::hal::setReDeReceive();
    }

    bool packetReceived() {

        const auto data = detail::simpleBusHelpers::Api::extractValue();
        if (data.ok)
            lastData = data.value;

        return data.ok;
    }

private:
};