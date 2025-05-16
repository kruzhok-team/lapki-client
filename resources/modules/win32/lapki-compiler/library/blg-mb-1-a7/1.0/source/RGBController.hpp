#pragma once

#include "Color.hpp"

namespace detail {

    namespace hal {
        
        struct RGBController {

            uint8_t currColor{};   // Текущий цвет (индекс)
            uint16_t value{};     // Счетчик тиков для таймера

            Color* color{};       // Текущий цвет. nullptr == выкл.
        };
    }
}