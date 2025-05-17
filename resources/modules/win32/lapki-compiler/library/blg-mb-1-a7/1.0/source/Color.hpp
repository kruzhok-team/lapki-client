#pragma once

namespace detail {

    struct Color {

        // Duration of red, green, blue shining and darkness (to reduce brightness)
        uint16_t colorsValue[4];   // red, green, blue, black
    };

    // Цвета, не предназначенные для использования пользователем
    Color ReservedColor1 = { 1, 1, 1, 1 };
    Color ReservedColor2 = { 1, 1, 1, 1 };
}

detail::Color ColorRed          = { {14,  0,  0,  0} };
detail::Color ColorReddish      = { {1,  0,  0,  50} };
detail::Color ColorOrange       = { {21,  1,  0,  0} };
detail::Color ColorGreen        = {  {0, 10,  0,  0} };
detail::Color ColorLime         = {  {6,  4,  0,  0} };
detail::Color ColorBlue         = {  {0,  0, 20,  0} };
detail::Color ColorCyan         = {  {0,  12, 10,  0} };
detail::Color ColorPink         = { {10,  0,  2,  0} };
detail::Color ColorPurple       = {  {6,  0, 10,  0} };
detail::Color ColorYellow       = { {10,  2,  0,  0} };
detail::Color ColorWhite        = { {15,  4,  1,  0} };
detail::Color ColorBlack        = {  {0,  0,  0, 99} };
detail::Color ColorPerfectWhite = { {10,  10,  10,  0} };
