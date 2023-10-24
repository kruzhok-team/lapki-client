export class DrawList {
  list = [] as string[];

  add(item: string) {
    this.list.push(item);
  }

  remove(item: string) {
    const index = this.list.findIndex((id) => id === item);
    this.list.splice(index, 1);
  }

  forEach(callback: (item: string) => void) {
    this.list.forEach(callback);
  }

  moveToEnd(item: string) {
    const index = this.list.findIndex((id) => id === item);
    this.list.splice(this.list.length - 1, 0, this.list.splice(index, 1)[0]);
  }
}
