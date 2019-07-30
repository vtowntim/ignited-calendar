/** @jsx jsx */
import { css, jsx, Global } from "@emotion/core";
import React from "react";
import ReactDOM from "react-dom";
import lodash from "lodash";
import moment from "moment";
import "semantic-ui-css/semantic.min.css";
import { Image, Card, Label, Header } from "semantic-ui-react";
// import { css } from "glamor";

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

const BOARD = getUrlVars()["b"] || "MUPgGToI";

function useTrelloBoard(boardId) {
  const [board, setBoard] = React.useState(null);
  const [lists, setLists] = React.useState([]);
  const [cards, setCards] = React.useState([]);

  React.useEffect(() => {
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

        setLists(returnedLists);
        console.log(returnedLists);
      } else {
        // We reached our target server, but it returned an error
      }
    };

    request.send();
  }, []);

  React.useEffect(() => {
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

        let $today = moment(Date.now()).subtract(1, "d");

        returnedCards = returnedCards.filter(c => {
          return moment(c.due).isAfter($today);
        });

        setCards(returnedCards);
        console.log(returnedCards);
      } else {
        // We reached our target server, but it returned an error
      }
    };

    request.send();
  }, []);

  React.useEffect(() => {
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

        setBoard(returnedLists);
        console.log(returnedLists);
      } else {
        // We reached our target server, but it returned an error
      }
    };

    request.send();
  }, []);

  // console.log(boardId, board, lists, cards);
  return [board, lists, cards];
}

function App() {
  const [board, lists, cards] = useTrelloBoard(BOARD);

  return (
    <div className="App">
      {lists.map(l => {
        return <List key={l.id} list={l} cards={cards} />;
      })}
    </div>
  );
}

function List({ list, cards }) {
  let myCards = cards.filter(c => {
    return c.idList === list.id;
  });

  if (list.name.indexOf("Unused") + 1) return null;

  if (myCards.length < 1) return null;

  return (
    <div
      css={css`
        margin-top: 2em;
        padding: 2em;
      `}
    >
      <Header as="h1">{list.name}</Header>
      <Card.Group>
        {myCards.map(c => {
          return <CardB key={c.id} card={c} />;
        })}
      </Card.Group>
    </div>
  );
}

function CardB({ card }) {
  let cover = null;
  if (card.idAttachmentCover) {
    cover = lodash.find(card.attachments, {
      id: card.idAttachmentCover
    });
  }

  let _mainLabelColor = "grey";
  if (card.labels.length) {
    _mainLabelColor = card.labels[0].color;
  }

  return (
    <Card centered color={card.labels.length > 0 && card.labels[0].color}>
      {cover && cover.previews.length > 0 && (
        <Image src={cover.previews[3].url} wrapped ui={false} />
      )}

      <Card.Content>
        <Card.Meta>{moment(card.due).format("MMM DD (ddd)")}</Card.Meta>
        <Card.Header>
          {lodash.startCase(
            lodash.toLower(
              `${card.name}`
                .split(" - ")
                .splice(1)
                .join(" - ") || card.name
            )
          )}
        </Card.Header>

        {card.labels.length > 0 && (
          <Label attached="top left" color={card.labels[0].color}>
            {card.labels[0].name}
          </Label>
        )}
      </Card.Content>
      {/* {card.name} */}
      {/* <CalendarDate due={card.due} color={_mainLabelColor} /> */}
    </Card>
  );
}

function CalendarDate({ due, color }) {
  let dueMoment = moment(due);

  let $calendar = css`
    width: 100;
    padding: 1em;
    color: ${COLORD[color]};
    text-align: center;
    font-weight: bold;
    text-transform: uppercase;
    border-left: 12pt solid ${COLOR[color]};
  `;

  let $month = css`
    font-size: 0.8em;
  `;

  let $date = css`
    font-size: 2em;
    line-height: 1em;
  `;

  let $day = css`
    font-size: 0.7em;
  `;

  if (!dueMoment) return <div css={$calendar} />;
  return (
    <div css={$calendar}>
      <div css={$month}>{dueMoment.format("MMMM")}</div>
      <div css={$date}>{dueMoment.format("DD")}</div>
      <div css={$day}>{dueMoment.format("dddd")}</div>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
