export class Observer<Subscriber extends Function = () => {}> {
  subscribers: Subscriber[] = [];

  subscribe(subscriber: Subscriber) {
    if (this.subscribers.includes(subscriber)) {
      return false;
    }

    this.subscribers.push(subscriber);

    return () => {
      const index = this.subscribers.indexOf(subscriber);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  dispatch(...args: any[]) {
    for (const subscriber of this.subscribers) {
      subscriber(...args);
    }
  }
}
