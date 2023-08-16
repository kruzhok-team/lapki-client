import { Component, ReactNode } from 'react';

export interface ScrollableListItem {
  id: string;
  content: ReactNode;
}

export interface ScrollableListProps {
  listItems: ScrollableListItem[];
  heightOfItem?: number;
  maxItemsToRender?: number;
  style?: React.CSSProperties;
  className?: string;
}

interface ScrollableListState {
  scrollPosition: number;
}

/**
 * Список со стабильным скроллингом.
 *
 * Порт на TypeScript и адаптация под div-ы следующей библиотеки:
 * https://github.com/jwarning/react-scrollable-list/
 */
export default class ScrollableList extends Component<ScrollableListProps, ScrollableListState> {
  static defaultProps: ScrollableListProps = {
    listItems: [],
    heightOfItem: 30,
    maxItemsToRender: 50,
    style: {},
    className: 'react-scrollable-list',
  };

  list: any;
  setListRef: (element: any) => void;

  constructor(props: ScrollableListProps) {
    super(props);
    this.state = { scrollPosition: 0 };
    this.list = null;

    this.setListRef = (element) => {
      this.list = element;
    };

    this.updateScrollPosition = this.updateScrollPosition.bind(this);
  }
  componentDidMount() {
    this.list.addEventListener('scroll', this.updateScrollPosition);
  }
  componentWillUnmount() {
    this.list.removeEventListener('scroll', this.updateScrollPosition);
  }
  updateScrollPosition() {
    const newScrollPosition = this.list.scrollTop / this.props.heightOfItem!;
    const difference = Math.abs(this.state.scrollPosition - newScrollPosition);

    if (difference >= this.props.maxItemsToRender! / 5) {
      this.setState({ scrollPosition: newScrollPosition });
    }
  }
  render() {
    const startPosition =
      this.state.scrollPosition - this.props.maxItemsToRender! > 0
        ? this.state.scrollPosition - this.props.maxItemsToRender!
        : 0;

    const endPosition =
      this.state.scrollPosition + this.props.maxItemsToRender! >= this.props.listItems.length
        ? this.props.listItems.length
        : this.state.scrollPosition + this.props.maxItemsToRender!;

    return (
      <div className={this.props.className} ref={this.setListRef} style={this.props.style}>
        <div
          key="list-spacer-top"
          style={{
            height: startPosition * this.props.heightOfItem!,
          }}
        />
        {this.props.listItems.slice(startPosition, endPosition).map((item) => (
          <div className="list-item" key={'list-item-' + item.id}>
            {item.content}
          </div>
        ))}
        <div
          key="list-spacer-bottom"
          style={{
            height:
              this.props.listItems.length * this.props.heightOfItem! -
              endPosition * this.props.heightOfItem!,
          }}
        />
      </div>
    );
  }
}
