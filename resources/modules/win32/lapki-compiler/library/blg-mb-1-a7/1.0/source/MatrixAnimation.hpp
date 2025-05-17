#pragma once

#include "Matrix.hpp"

namespace detail {

    namespace matrixAnim {

        bool isInit{ false };


        int8_t diffs[mrx::hal::matrix::LEDS_COUNT] = {};

        Matrix m{};
        
        Pattern35 progressPattern{};
        auto patternIt = reinterpret_cast<uint8_t*>(&progressPattern);

        Pattern35 finishedPattern{};
        int16_t steps{};
        volatile bool isActive{};

        // Предрассчитаем шаги анимации заранее
        void initAnim() {

            // Заполняем шаги анимации + ложим начальные значения в progressPattern через patternIt
            for (uint8_t i(0); i < mrx::hal::matrix::LEDS_COUNT; ++i) {

                const auto from = detail::matrix::leds[i].getBrightness();
                /*const*/ auto to = reinterpret_cast</*const*/ uint8_t* const>(&finishedPattern)[i];

                // TODO: ЗАГЛУШКА, так как клиент щас шлет 0 или 1
                to = (to == 0) ? 0 : 100;
                reinterpret_cast<uint8_t* const>(&finishedPattern)[i] = to;

                diffs[i] = ((int8_t)to - from) /steps;

                patternIt[i] = from;
            }
        }

        void interruptFunc() {

            if (isActive) {

                --steps;
                if (steps == 0) {
                    isActive = false;
                    // Установить конечный паттерн при завершении анимации
                    m.setPatternByStep(finishedPattern);
                    return;
                }
                
                // Просчитываем новый промежуточный кадр
                for (uint8_t i(0); i < mrx::hal::matrix::LEDS_COUNT; ++i) {

                    patternIt[i] += diffs[i];
                }

                m.setPatternByStep(progressPattern);
            }
        }
    }
}

class MatrixAnimation {

public:

    MatrixAnimation() {

        if (!detail::matrixAnim::isInit) {

            // initialization matrix
            Matrix m{};

            mrx::hal::matrixAnimation::interruptFunc = detail::matrixAnim::interruptFunc;

            detail::matrixAnim::isInit = true;
        }
    }

    void setFrame(const Pattern35& pattern, const uint32_t time_ms) {

        // Количество шагов фиксированное
        detail::matrixAnim::steps = 20;
        // 1ms == 40'000 / 1000ms = 40 (ticks in ms)
        const auto ticks = time_ms *40;
        // Делим на кол-во шагов
        mrx::hal::matrixAnimation::animLevel = ticks /detail::matrixAnim::steps;
        
        // Рассчитаем кол-во тиков для анимации (отмеряем кусками времени)
        //
        // Продолжительность одного шага
        // auto stepMs = time_ms /detail::matrixAnim::steps;
        // if (stepMs < 1) stepMs = 1;
        //
        // Переводим в тики счетчика
        // mrx::hal::matrixAnimation::animLevel = (stepMs *mrx::hal::matrixAnimation::baseLevel);

        // Заполняем нужные данные
        detail::matrixAnim::finishedPattern = pattern;
        detail::matrixAnim::initAnim();
        // Запускаем анимацию
        detail::matrixAnim::isActive = true;
    }

    bool AnimationFinished() {

        return !detail::matrixAnim::isActive;
    }
};