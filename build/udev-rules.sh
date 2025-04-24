#!/usr/bin/env bash 

# Определяем файл для правил udev
UDEV_RULES_FILE="/etc/udev/rules.d/99-mb1.rules"

# Проверяем, существует ли файл, если нет, создаем его
if [ ! -f "$UDEV_RULES_FILE" ]; then
    touch "$UDEV_RULES_FILE"
fi

# Добавляем правило в файл
echo 'SUBSYSTEM=="usb", ATTRS{idVendor}=="1209", ATTRS{idProduct}=="ac01", GROUP="dialout", MODE="0666"' >> "$UDEV_RULES_FILE"

# Перезагружаем правила udev
udevadm control --reload-rules
udevadm trigger

echo "Правило успешно добавлено в $UDEV_RULES_FILE"