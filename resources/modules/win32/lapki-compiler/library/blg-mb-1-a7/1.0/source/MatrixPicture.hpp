#pragma once

#include "Matrix.hpp"
#include "Pictures.hpp"

namespace detail {

    namespace matrixPicture {

        bool isInit { false };
        Matrix m{};
    }
}

class MatrixPicture {

public:

    MatrixPicture() {

        if (!detail::matrixPicture::isInit) {

            // initialization matrix
            Matrix m{};

            detail::matrixPicture::isInit = true;
        }
    }

    void draw(const Picture& picture) {

        detail::matrixPicture::m.setPattern(picture.p);
    }
};