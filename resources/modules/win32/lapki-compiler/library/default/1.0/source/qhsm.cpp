#include "qhsm.hpp"

#include <stddef.h>

const QEvt standard_events[] = {
    {(QSignal)(QEP_EMPTY_SIG_)},
    {(QSignal)(Q_ENTRY_SIG)},
    {(QSignal)(Q_EXIT_SIG)},
    {(QSignal)(Q_INIT_SIG)},
};

QState QHsm_top(void *const me, const QEvt *const event)
{
    (void)(me);
    (void)(event);

    return (QState)(Q_RET_IGNORED);
}

static void do_transition(QHsm *me)
{
    QStateHandler source = me->current_;
    QStateHandler effective = me->effective_;
    QStateHandler target = me->target_;

    while (source != effective) {
        source(me, &standard_events[Q_EXIT_SIG]);
        source(me, &standard_events[QEP_EMPTY_SIG_]);
        source = me->effective_;
    }

    if (source == target) {
        source(me, &standard_events[Q_EXIT_SIG]);
        target(me, &standard_events[Q_ENTRY_SIG]);

        me->current_ = target;
        me->effective_ = target;
        me->target_ = NULL;
        return;
    }

    QStateHandler path[Q_MAX_DEPTH];
    ptrdiff_t top = 0;
    ptrdiff_t lca = -1;

    path[0] = target;
    // Формируем путь от текущего состояния до самого дальнего родителя
    while (target != &QHsm_top) {
        target(me, &standard_events[QEP_EMPTY_SIG_]);
        target = me->effective_;
        path[++top] = target;

        if (target == source) { // Если вышли на самих себя, то выходим?
            lca = top;
            break;
        }
    }

    while (lca == -1) {
        // Выходим из состояний.
        source(me, &standard_events[Q_EXIT_SIG]);
        source(me, &standard_events[QEP_EMPTY_SIG_]);
        source = me->effective_;

        // Если текущее состояние является родителем, то выходим из цикла
        // Пока не вижу ситуаций, когда мы делаем в этом цикле больше одной итерации
        for (ptrdiff_t i = 0; i <= top; ++i) {
            if (path[i] == source) {
                lca = i;
                break;
            }
        }
    }

    target = path[lca];

    if (lca == 0) {
        target(me, &standard_events[Q_ENTRY_SIG]);
    }

    for (ptrdiff_t i = lca - 1; i >= 0; --i) {
        target = path[i];
        target(me, &standard_events[Q_ENTRY_SIG]);
    }

    me->current_ = target;
    me->effective_ = target;
    me->target_ = NULL;
}

void QHsm_ctor(QHsm *const me, QStateHandler initial)
{
    me->current_ = initial;
    me->effective_ = initial;
    me->target_ = NULL;
}

void QMsm_init(QHsm *me, const QEvt *const event)
{
    me->current_(me, event);

    me->effective_ = &QHsm_top;
    do_transition(me);
}

QState QMsm_dispatch(QHsm *me, const QEvt *const event)
{
    QState result = me->current_(me, event);

    while (result == Q_RET_SUPER) {
        result = me->effective_(me, event);
    }

    switch (result) {
    case (QState)(Q_RET_TRAN):
        do_transition(me);
        break;
    case (QState)(Q_RET_HANDLED):
    case (QState)(Q_RET_UNHANDLED):
    case (QState)(Q_RET_IGNORED):
        me->effective_ = me->current_;
        break;
    default:
        break;
    }

    return result;
}

QState QMsm_simple_dispatch(QHsm *me, QSignal signal)
{
    const QEvt event = {signal};
    return QMsm_dispatch(me, &event);
}
