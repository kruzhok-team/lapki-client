#pragma once

#define SIZE_ARRAY 50

class Array {

    int16_t data[SIZE_ARRAY]{};

public:

    int16_t value{};

    uint16_t index{};
    uint16_t size{};

    explicit Array(const uint16_t size)
        : size(size) {
        if (size > SIZE_ARRAY) {
            this->size = SIZE_ARRAY;
        }
    }

    void set(const uint16_t index, const int16_t value) {

        if (isValidIndex(index)) {

            data[index] = value;

            if (this->index == index) {
                this->value = value;
            }
        }
    }

    void peek(const uint16_t index) {

        if (isValidIndex(index)) {

            this->index = index;
            value = data[index];
        }
    }

    void next() {

        if (isValidIndex(index +1)) {
            
            ++index;
            value = data[index];
        }
    }

    void prev() {

        if (isValidIndex(index -1)) {

            --index;
            value = data[index];
        }
    }

private:

    bool isValidIndex(const uint16_t index) const {
        return index < size;
    }
};