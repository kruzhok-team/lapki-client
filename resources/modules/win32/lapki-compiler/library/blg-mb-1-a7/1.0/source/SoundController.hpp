#pragma once

#include "CommonSound.hpp"

namespace detail {

    namespace hal {

        struct SoundController {

            // index in Sound
            uint32_t index{};

            // Counter progress
            uint32_t curr{};
            uint32_t total{};
            
            Sound* sound{};
        };
    }
}