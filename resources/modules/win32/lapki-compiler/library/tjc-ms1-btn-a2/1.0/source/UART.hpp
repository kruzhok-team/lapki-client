#pragma once
#define UART1__
/*
    Здесь реализация модулей UART1 и UART2 для использования в user code (bootloader)
    UART 1: tested on main-a4, btn-a2
    UART 2: tested on mtrx-a2

    Для выбора нужного модуля необходимо прописать директиву '#define UART1__' или '#define UART2__'
    Использование сразу двух модулей не допустимо (в таком случае будет ошибка компиляции (сбой макросов препроцессора))
*/

// Проверка корректности определения нужного типа юарта
#ifndef UART1__

    #ifndef UART2__
        #error "Define need UART type for use! (Write: \'#define UART1__\' or \'#define UART2__\') (See file UART.hpp)"
    #endif

#endif

#ifdef UART1__

    #ifdef UART2__
        #error "Defined UART1__ and UART2__. You need choice only ONE UART TYPE!"
    #endif

#endif

// for preprocessor
// Так будет меньше кода (функции не дублируются)
// Жертвуем кодочитаемостью, но это только у функций-прерываний DataBus и SimpleBus (Причина: так удобнее поддерживать их код)
#ifdef UART1__
    #define UART__num 1
    // Берет токен аргументом и добавляет в конец нужную цифру - номер юарта
    #define UARTConcat__( before ) before##1
    // Берет два токена аргументом и добавляет между ними нужную цифру - номер юарта
    // Пример: UARTInsertion__(funcNameBegin, funcNameEnd)
    // Результат : funcNameBegin1funcNameEnd или funcNameBegin2funcNameEnd
    #define UARTInsertion__( before, after ) before##1##after
#endif
#ifdef UART2__
    #define UART__num 2
    #define UARTConcat__( before ) before##2
    #define UARTInsertion__( before, after ) before##2##after
#endif

#include "Pins.hpp"
#include "macros.hpp"

namespace detail {

    namespace debug {

        bool debugLedIndicator = false;
        uint32_t timer = 0;
    }

    namespace constants {

        // ReDe подцеплен к PA0
        GPIO_TypeDef* const ReDePort = GPIOA;
        const uint8_t ReDeNum = 0;

        const uint8_t RECEIVE_MODE = 1;
        const uint8_t SEND_MODE = 2;

        const uint8_t CR = 13;   // value for begin msg packet
        const uint8_t LF = 10;   // value for end msg packet
    }

    namespace helper {

        // Инициализация пина ReDe
        INLINE__ STATIC__ void initReDe(void) {

            initPin_OD(detail::constants::ReDePort, detail::constants::ReDeNum);
        }

        // Управление драйвером RS485 (MAX3441)
        // Для аргумента использовать константы выше из detail::constants (RECEIVE_MODE, SEND_MODE)
        INLINE__ STATIC__
        void setReDe(const uint8_t x) {
            
            setPin_OD(detail::constants::ReDePort, detail::constants::ReDeNum, x);
        }
    }

    namespace simpleBusHelpers {

        uint8_t addr;   // Адрес - 8 битное беззнаковое целое значение
        // Перед отправкой адрес преобразуется в 2 байта, с переводом каждого полубайта в аски код
        // Чтобы не делать этого каждый раз при получении данных в функции-прерывании или при отправке пакета -
        // делаем это единожды при установке адреса устройству
        uint16_t addrAsci;  // for quick check in interrupt function

        // Обработка байт пакета при получении данных с шины юарта
        uint8_t interruptBuffer[5];
        uint8_t packetIterator = 0;

        // Хранение полученных данных (ждут, пока пользовательский код считает их)
        // Буффер - аккумулирует значения (кольцевой)
        const uint8_t SIZESimpleBus = 5;
        uint8_t userBuffer[SIZESimpleBus];
        // 2 указателя
        // l - Указывает на очередной байт, который будет считан пользовательским кодом
        // r - Указывает на место, куда функция-прерывание будет записывать новый полученный байт
        uint8_t l = 0, r = 0;
        // Инвариант - если l == r, новые данные кончились (пользовательский код все считал)

        // Функция для безопасного инкремента l - указателя
        void shiftLPointer() {
            if (++l >= SIZESimpleBus)
                l = 0;
        }

        // Функция для безопасного инкремента r - указателя
        void shiftRPointer() {
            if (++r >= SIZESimpleBus)
                r = 0;
        }

        namespace Api {

            struct Pair { bool ok; uint8_t value; };

            // Вызывается из SimpleBus класса для изъятия данных и предоставления их пользователю
            Pair extractValue() {

                Pair res{}; // by default - ok == false (no data)

                if (l != r) {   // data arrived -> extract
                    res.ok = true;
                    res.value = userBuffer[l];
                    shiftLPointer();
                }

                return res;
            }

            // Вызывается из функции-прерывания для сохранения данных
            void putValue(uint8_t value) {

                userBuffer[r] = value;
                shiftRPointer();
            }
        }
    }

    namespace dataBusHelpers {

        bool isByteReceived;
        uint8_t* receivedByte;
    }

    namespace hal {

        bool isUARTInit = false;

        // Настройка USART2
        // t127 p826 RM0454 // Таблица прерываний UART
            INLINE__ STATIC__ 
            void initUART(const uint32_t baudrate) {

            isUARTInit = true;
            
            // 1. Включить тактование
            #if defined(UART1__)
                // Включаем модуль UART (Включаем тактирование USART1 от шины APB)
                RCC -> APBENR2 |= RCC_APBENR2_USART1EN;
            #elif defined(UART2__)
                // Включаем модуль UART (Включаем тактирование USART2 от шины APB)
                RCC -> APBENR1 |= RCC_APBENR1_USART2EN;
            #endif

            // 2. Настроить ноги
            // Включаем тактирование ног UART (Включаем тактирование модуля GPIOA)
            RCC -> IOPENR |= RCC_IOPENR_GPIOAEN;  // also for ReDe!
            RCC -> IOPENR |= RCC_IOPENR_GPIOBEN;

            // Настраиваем ноги контроллера для работы с UART
            #if defined(UART1__)
                // UART1 на ногах PB6 {AF=1, Tx}, PB7 {AF=1, Rx}
                initPin_AF_OD ( GPIOB, 6, 0 ); //[A.1][B.2]
                initPin_AF_OD ( GPIOB, 7, 0 ); //[A.2][B.2]
            #elif defined(UART2__)
                // UART2 на ногах PA2 {AF=1, Tx}, PA3 {AF=1, Rx}
                initPin_AF_PP ( GPIOA, 3, 1 ); //[A.1][B.2]
                initPin_AF_PP ( GPIOA, 2, 1 ); //[A.2][B.2]
            #endif

            // 3. Настроить скорость
            // Установка скорости UART
            #if defined(UART1__)
                USART1 -> BRR |= (uint32_t)( PCLK/baudrate ); // { Baudrate = PCLK / BRR } -> { BRR = PCLK / Baudrate }
            #elif defined(UART2__)
                USART2 -> BRR |= (uint32_t)( PCLK/baudrate ); // { Baudrate = PCLK / BRR } -> { BRR = PCLK / Baudrate }
            #endif

            // 4. Включить прерывание по Rx
            // Включаем прерывание по Rx - RXNE (Rx buffer not empty), оно склеено с прерыванием RXFNE для режима FIFO
            // s26.8.2 p831 RM0454 // Описание регистра CR1
            #if defined(UART1__)
                USART1 -> CR1 |= USART_CR1_RXNEIE_RXFNEIE;
            #elif defined(UART2__)
                USART2 -> CR1 |= USART_CR1_RXNEIE_RXFNEIE;
            #endif

            // 5. Включить сам модуль
            // Включаем работу модуля
            #if defined(UART1__)
                USART1 -> CR1 |= USART_CR1_UE;
            #elif defined(UART2__)
                USART2 -> CR1 |= USART_CR1_UE;
            #endif

            // 6. Включить приёмник
            // Включаем приёмник
            #if defined(UART1__)
                USART1 -> CR1 |= USART_CR1_RE;
            #elif defined(UART2__)
                USART2 -> CR1 |= USART_CR1_RE;
            #endif

            // 7. Включить передатчик
            // Включаем передатчик
            #if defined(UART1__)
                USART1 -> CR1 |= USART_CR1_TE;
            #elif defined(UART2__)
                USART2 -> CR1 |= USART_CR1_TE;
            #endif

            // 8. Активировать прерывание в NVIC
            // s11 p250 RM0454 // Описание NVIC
            #if defined(UART1__)
                // Разрешаем прерывание UART1: UART1_IRQn
                NVIC_EnableIRQ(USART1_IRQn);
            #elif defined(UART2__)
                // Разрешаем прерывание UART2: UART2_IRQn
                NVIC_EnableIRQ(USART2_IRQn);
            #endif

            // Инициализируем и переводим в режим приёма пин ReDe
            detail::helper::initReDe();
            detail::helper::setReDe(detail::constants::RECEIVE_MODE);
        }

        void initUartWrapper() {

            // Только если пользователь не инициализировал раньше нас
            if (isUARTInit == false) {
                initUART(9600);
            }
        }

        // Обёртка над setReDe, уменьшающая путаницу (ждём, чтобы модуль UART завершил передачу, затем включаем приём)
        // p850 RM0454 - Описание флага TC
        void setReDeReceive(void) {

            #if defined(UART1__)
                while (((USART1 -> ISR) & USART_ISR_TC ) == 0);
            #elif defined(UART2__)
                while (((USART2 -> ISR) & USART_ISR_TC ) == 0);
            #endif
            detail::helper::setReDe(detail::constants::RECEIVE_MODE);
        }

        // Обёртка над setReDe, уменьшающая путаницу (включаем передачу)
        void setReDeTransmit(void) {

            detail::helper::setReDe(detail::constants::SEND_MODE);
        }
        
        // Передача одного символа (семантика ReDe вовне этой функции)
        void putChar(const uint8_t x) {

            #if defined(UART1__)
                // Ждем, пока значение регистра TDR будет обработано
                while ((USART1 -> ISR & USART_ISR_TXE_TXFNF) == 0);
                
                // Отправляем байт
                USART1 -> TDR = x;
            #elif defined(UART2__)
                // Ждем, пока значение регистра TDR будет обработано
                while ((USART2 -> ISR & USART_ISR_TXE_TXFNF) == 0);

                // Отправляем байт
                USART2 -> TDR = x;
            #endif

            // for gebug
            detail::debug::debugLedIndicator = true;
        }

        namespace api {

            bool isDataBusActive = false;
            bool isSimpleBusActive = false;
            
            // Ниже функции для прерывания, нужно выбрать одну подходящую.
            // Но их линкер не найдет. Поэтому требуется функция обертка, которую он найдет
            // Эта функция-обертка находится непосредственно, либо в DataBus.hpp, либо в SimpleBus.hpp

            // Функция затычка UART1 и UART2 (чтобы плата молчала и не мешала другим общаться, если не используются явно serial-протоколы на ней)
            void UARTInsertion__(USART, _IRQHandlerPlug) (void) {

                // Читаем пришедшее значение (других источников у этого прерывания нет)
                uint8_t gotByte = UARTConcat__(USART) -> RDR;

                // TODO: Не нужно, этот флаг сбрасывается сразу при чтении из RDR
                UARTConcat__(USART) -> RQR |= USART_RQR_RXFRQ;

                // debug
                detail::debug::debugLedIndicator = true;
            }
            
            // Функция для DataBus UART1 и UART2
            void UARTInsertion__(USART, _IRQHandlerDataBus)(void) {

                using namespace detail::dataBusHelpers;

                // Читаем пришедшее значение (других источников у этого прерывания нет)
                uint8_t gotByte = UARTConcat__(USART) -> RDR;

                // Сохраняем пришедшее значение
                *receivedByte = gotByte;
                isByteReceived = true;

                // TODO: Не нужно, этот флаг сбрасывается сразу при чтении из RDR
                UARTConcat__(USART) -> RQR |= USART_RQR_RXFRQ;

                // debug
                detail::debug::debugLedIndicator = true;
            }

            // Функция для SimpleBus UART1 и UART2
            void UARTInsertion__(USART, _IRQHandlerSimpleBus) (void) {

                using namespace detail::simpleBusHelpers;
                using namespace detail::simpleBusHelpers::Api;
                using namespace detail::constants;

                // Читаем пришедшее значение (других источников у этого прерывания нет)
                uint8_t gotByte = UARTConcat__(USART) -> RDR;

                // save to buffer
                interruptBuffer[packetIterator++] = gotByte;

                // if packet ready (got 5 bytes in buffer) then parse
                if (packetIterator >= 5) {

                    if (interruptBuffer[0] == CR && interruptBuffer[4] == LF) {   // packet is correct

                        // pull addr (При сдвигах начинается лютая жесть, поэтому в целях совместимости с чипом лучше оставить так)
                        // uint16_t targetAddr = ((*reinterpret_cast<uint16_t*>(&buffer[1])) << 8) | buffer[2];
                        uint16_t targetAddr = interruptBuffer[1];
                        targetAddr = (targetAddr << 8) | interruptBuffer[2];
                        
                        if (targetAddr == addrAsci) {

                            putValue(interruptBuffer[3]);
                        }
                        packetIterator = 0; // reset buffer
                    }
                    else {  // packet not correct -> shift to one byte?

                        *reinterpret_cast<uint16_t* const>(&interruptBuffer[0]) = *reinterpret_cast<uint16_t const * const>(&interruptBuffer[1]);
                        *reinterpret_cast<uint16_t* const>(&interruptBuffer[2]) = *reinterpret_cast<uint16_t const * const>(&interruptBuffer[3]);
                        --packetIterator; // decrease buffer
                    }
                }

                // TODO: Не нужно, этот флаг сбрасывается сразу при чтении из RDR
                UARTConcat__(USART) -> RQR |= USART_RQR_RXFRQ;

                // debug
                detail::debug::debugLedIndicator = true;
            }
        }
    }
}

extern "C" {

    void UARTInsertion__(USART, _IRQHandler) (void) {

        if (detail::hal::api::isSimpleBusActive) {
            UARTInsertion__(detail::hal::api::USART, _IRQHandlerSimpleBus)();
        }
        else if (detail::hal::api::isDataBusActive) {
            UARTInsertion__(detail::hal::api::USART, _IRQHandlerDataBus)();
        } else {
            UARTInsertion__(detail::hal::api::USART, _IRQHandlerPlug)();
        }
    }
}