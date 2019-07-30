import React, { Component } from "react";
import Reflux from "reflux";
import lodash from "lodash";
import moment from "moment";
import { css } from "glamor";
import Icon from "@fortawesome/react-fontawesome";

css.global("html, body", { fontSize: "10pt", color: "#212121" });

let COLOR = {
  green: "#8BC34A",
  red: "#f44336",
  grey: "#607D8B",
  orange: "#FF9800",
  yellow: "#FFEB3B",
  blue: "#03A9F4",
  purple: "#9C27B0"
};

let COLORD = {
  green: "#2E7D32",
  red: "#c62828",
  grey: "#424242",
  orange: "#EF6C00",
  yellow: "#795548",
  blue: "#0277BD",
  purple: "#6A1B9A"
};

let COLORL = {
  green: "#F1F8E9",
  red: "#ffebee",
  grey: "#ECEFF1",
  orange: "#FFF3E0",
  yellow: "#FFFDE7",
  blue: "#E1F5FE",
  purple: "#F3E5F5"
};

var ACTIONS = Reflux.createActions([
  "getLists",
  "getBoard",
  "getCards",
  "placeCards",
  "toggleLabel",
  "addLoader",
  "removeLoader"
]);

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(
    m,
    key,
    value
  ) {
    vars[key] = value;
  });
  return vars;
}

let BOARD = getUrlVars()["b"];

class STORE extends Reflux.Store {
  constructor() {
    super();

    let _initalFilter = getUrlVars()["f"] ? getUrlVars()["f"].split(",") : [];
    let _showLink = getUrlVars()["l"] ? true : false;

    let _showFilters = getUrlVars()["s"] ? true : false;

    this.state = {
      loading: 0,
      board: null,
      boardID: BOARD,
      lists: [],
      cards: [],
      showFilters: _showFilters,
      showLink: _showLink,
      filter: _initalFilter
    };
    this.listenToMany(ACTIONS);

    if (BOARD) {
      ACTIONS.getBoard();
      ACTIONS.getLists();
    }
  }

  onToggleLabel(labelName) {
    if (this.state.filter.includes(labelName)) {
      this.state.filter = lodash.without(this.state.filter, labelName);
    } else {
      this.state.filter.push(labelName);
    }
    this.setState({ filter: this.state.filter });
  }

  onGetBoard() {
    var _Store = this;
    var request = new XMLHttpRequest();
    request.open("GET", `https://api.trello.com/1/boards/${BOARD}`, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var returnedBoard = JSON.parse(this.response);

        returnedBoard.labels = [];

        lodash.forIn(returnedBoard.labelNames, (key, value) => {
          if (key)
            returnedBoard.labels.push({
              name: key,
              color: value
            });
        });

        returnedBoard.labelKeys = Object.keys(returnedBoard.labelNames);

        document.title = returnedBoard.name;

        _Store.setState({ board: returnedBoard });

        ACTIONS.removeLoader();
      } else {
        // We reached our target server, but it returned an error
      }
    };

    ACTIONS.addLoader();
    request.send();
  }

  onAddLoader() {
    this.setState({ loading: this.state.loading + 1 });
  }

  onRemoveLoader() {
    this.setState({ loading: this.state.loading - 1 });
  }

  onGetLists() {
    var _Store = this;
    var request = new XMLHttpRequest();
    request.open("GET", `https://api.trello.com/1/boards/${BOARD}/lists`, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var returnedLists = JSON.parse(this.response);

        if (!Array.isArray(returnedLists)) returnedLists = [returnedLists];

        returnedLists.map(list => {
          list.cards = [];
          return list;
        });

        _Store.setState({ lists: returnedLists });
        ACTIONS.removeLoader();
        ACTIONS.getCards();
      } else {
        // We reached our target server, but it returned an error
      }
    };

    ACTIONS.addLoader();
    request.send();
  }

  onGetCards() {
    var _Store = this;
    var request = new XMLHttpRequest();
    request.open(
      "GET",
      `https://api.trello.com/1/boards/${BOARD}/cards?attachments=true&fields=id,desc,idList,idAttachmentCover,name,due,labels,url`,
      true
    );

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var returnedCards = JSON.parse(this.response);

        if (!Array.isArray(returnedCards)) returnedCards = [returnedCards];

        returnedCards.map(_card => {
          _card.cover = null;
          if (_card.idAttachmentCover) {
            _card.cover = lodash.find(_card.attachments, {
              id: _card.idAttachmentCover
            });
          }

          _card.dueMoment = null;
          _card.dueShort = null;
          if (_card.due) {
            _card.dueMoment = moment(_card.due);
            _card.dueShort = _card.dueMoment.format("YYYY-MM-DD");
          }

          if (_card.labels) {
            _card.labelNames = _card.labels.map(label => {
              return label.name;
            });
          } else {
            _card.labelNames = [];
          }

          return _card;
        });

        _Store.setState({ cards: returnedCards });
        ACTIONS.removeLoader();
        ACTIONS.placeCards();
      } else {
        // We reached our target server, but it returned an error
      }
    };

    ACTIONS.addLoader();
    request.send();
  }

  onPlaceCards() {
    let _lists = this.state.lists;

    _lists.map(_list => {
      _list.cards = lodash.filter(this.state.cards, { idList: _list.id });
      return _list;
    });

    this.setState({ lists: _lists });
  }
}

class Cover extends Component {
  render() {
    let { cover } = this.props;

    let $cover = css({
      width: "100%",
      minHeight: "80",
      textAlign: "center",
      "@media print": {
        minHeight: "40"
      },
      "@media (min-width: 768px)": {
        width: "120"
      }
    });

    if (!cover) return <div {...css($cover)} />;

    let $bg = css({
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: cover.edgeColor,
      backgroundImage: `url(${cover.previews[1].url})`
    });

    return <div {...css($cover, $bg)} />;
  }
}

class LabelList extends Component {
  render() {
    let { labels } = this.props;
    return (
      <div>
        {labels.map(label => {
          return <Label key={label.id} label={label} />;
        })}
      </div>
    );
  }
}

class Label extends Component {
  render() {
    let { label } = this.props;
    let $label = css({
      display: "inline-block",
      padding: "2pt 8pt",
      borderRadius: "4pt",
      fontSize: ".7em",
      color: "#fff",
      marginTop: ".5em",
      fontWeight: "bold",
      textTransform: "uppercase",
      backgroundColor: COLORD[label.color]
    });
    return <span {...$label}>{label.name || label.color}</span>;
  }
}

class Calendar extends Component {
  render() {
    let { dueMoment, color } = this.props;

    let $calendar = css({
      width: "100",
      padding: "1em",
      color: COLORD[color],
      textAlign: "center",
      fontWeight: "bold",
      textTransform: "uppercase",
      borderLeft: `12pt solid ${COLOR[color]}`
    });

    let $month = css({
      fontSize: ".8em"
    });
    let $date = css({
      fontSize: "2em",
      lineHeight: "1em"
    });
    let $day = css({
      fontSize: ".7em"
    });

    if (!dueMoment) return <div {...$calendar} />;
    return (
      <div {...$calendar}>
        <div {...$month}>{dueMoment.format("MMMM")}</div>
        <div {...$date}>{dueMoment.format("DD")}</div>
        <div {...$day}>{dueMoment.format("dddd")}</div>
      </div>
    );
  }
}

class Card extends Component {
  constructor(props) {
    super(props);
    this.handleClickLinkOut = this.handleClickLinkOut.bind(this);
  }
  handleClickLinkOut() {
    window.open(this.props.card.url, "_blank");
  }

  render() {
    let { card, filter, showLink } = this.props;

    if (filter.length) {
      let _intersection = lodash.intersection(card.labelNames, filter);

      if (!_intersection.length) return null;
    }

    let _mainLabelColor = "grey";
    if (card.labels.length) {
      _mainLabelColor = card.labels[0].color;
    }

    let $card = css({
      display: "flex",
      margin: "1em",
      alignItems: "stretch",
      justifyContent: "space-between",
      backgroundColor: COLORL[_mainLabelColor],
      pageBreakInside: "avoid"
    });

    let $cardSection = css({
      display: "flex",
      alignItems: "center"
    });

    let $coverAndDetails = css({
      flexGrow: 1,

      "@media (min-width: 768px)": {
        display: "flex"
      }
    });

    let $cardDetails = css({
      padding: "1em",

      alignSelf: "center"
    });

    let $cardName = css({
      color: COLORD[_mainLabelColor],
      fontWeight: "bold",
      fontSize: "1.2em"
    });

    let $hide = css({
      display: "none"
    });

    let $linkOut = css(
      {
        width: 50,
        cursor: "pointer",
        color: COLOR[_mainLabelColor],
        justifyContent: "center",
        "&:hover": {
          backgroundColor: COLOR[_mainLabelColor],
          color: "#fff"
        },
        "@media print": {
          display: "none !important"
        }
      },
      $cardSection
    );

    return (
      <div {...$card}>
        <Calendar dueMoment={card.dueMoment} color={_mainLabelColor} />

        <div {...$coverAndDetails}>
          <Cover cover={card.cover} />
          <div {...$cardDetails}>
            <div {...$cardName}>{card.name}</div>
            <LabelList labels={card.labels} />
            {card.desc}
          </div>
        </div>
        <div {...css($linkOut, !showLink && $hide)}>
          <Icon
            onClick={this.handleClickLinkOut}
            size="2x"
            name="chevron-right"
          />
        </div>
      </div>
    );
  }
}

class List extends Component {
  render() {
    let { list, filter, showLink } = this.props;

    let $list = css({
      pageBreakInside: "avoid",
      // pageBreakAfter: "always",
      "& h2": {
        fontSize: "2em",
        margin: "1em"
      }
    });
    return (
      <div {...$list}>
        <h2>{list.name}</h2>
        {list.cards &&
          list.cards.map(card => {
            return (
              <Card
                showLink={showLink}
                filter={filter}
                card={card}
                key={card.id}
              />
            );
          })}
      </div>
    );
  }
}

class LabelToggle extends Component {
  render() {
    let { label, filter } = this.props;

    let _selected = filter.includes(label.name) ? true : false;

    let $selected = css({
      color: "#212121",
      backgroundColor: COLOR[label.color],
      "&:hover": {
        color: COLORD[label.color]
      }
    });

    let $labelToggle = css(
      {
        color: COLORD[label.color],
        flexGrow: 1,
        cursor: "pointer",
        textAlign: "center",
        fontWeight: "bold",
        padding: "1em",
        textTransform: "uppercase",
        backgroundColor: COLORL[label.color],
        "&:hover": {
          backgroundColor: COLOR[label.color],
          color: "#fff"
        }
      },
      _selected && $selected
    );
    return (
      <div
        {...$labelToggle}
        onClick={ACTIONS.toggleLabel.bind(this, label.name)}
      >
        {label.name}
      </div>
    );
  }
}

class LabelTogglesList extends Component {
  render() {
    let { labels, filter } = this.props;
    if (!labels) return false;

    let $labelToggleList = css({
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-around",
      "@media print": {
        display: "none !important"
      }
    });

    return (
      <div {...$labelToggleList}>
        {labels.map(label => {
          return (
            <LabelToggle key={label.color} filter={filter} label={label} />
          );
        })}
      </div>
    );
  }
}

export class App extends Reflux.Component {
  constructor(props) {
    super(props);

    this.state = {
      store: "loaded"
    };
    this.store = STORE;
  }

  render() {
    let $hide = css({
      display: "none"
    });

    let $title = css({
      textAlign: "center",
      margin: ".5em"
    });

    return (
      <div className="App">
        {this.state.board && this.state.showFilters && (
          <LabelTogglesList
            filter={this.state.filter}
            labels={this.state.board.labels}
          />
        )}

        {this.state.board && <h1 {...$title}>{this.state.board.name}</h1>}

        <div
          {...css(!this.state.loading && $hide, {
            textAlign: "center",
            color: "#00ACC1"
          })}
        >
          <Icon pulse size="4x" name="spinner" />
        </div>

        {this.state.lists.map(list => {
          return (
            <List
              showLink={this.state.showLink}
              filter={this.state.filter}
              list={list}
              key={list.id}
            />
          );
        })}
      </div>
    );
  }
}
