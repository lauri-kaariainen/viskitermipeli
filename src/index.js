import "./style";
import { render } from "preact";
import { useState } from "preact/hooks";
import { Term } from "./components/Term.js";
import { getSeededSampleOfN, shuffle, uniqueShallow } from "./helpers.js";
import { getRealTerms } from "./getTerms.js";
import { SearchedList } from "./components/SearchedList.js";
import ALLWHISKEYTERMS from "./viskitermit.json";

const GAMESTATES = {
  PRESTART: 0,
  GETWHISKEY: 1,
  GUESSING: 2,
  RESULT: 3
};

//lower is easier
const DIFFICULTYLEVEL = 6;

const possibleSeed = Math.floor(ALLWHISKEYTERMS.length * Math.random());

function App() {
  const [gameState, setGameState] = useState(GAMESTATES.PRESTART);
  const [inputState, setInputState] = useState("");
  const [guessableTermsState, setGuessableTermsState] = useState([]);
  const [searchedWhiskeys, setSearchedWhiskeys] = useState([]);
  const [guessesList, setGuessesList] = useState([]);
  const [correctWhiskeyTerms, setCorrectWhiskeyTerms] = useState([]);
  const [seed, setSeed] = useState(possibleSeed);
  const fakeSample = getSeededSampleOfN(ALLWHISKEYTERMS, DIFFICULTYLEVEL, seed);

  const handleInputChange = ev => {
    if (ev.target.value.length > 2) {
      fetch(
        "//lauri.space/alko-product-api/products/whiskeys?search=" +
          encodeURIComponent(ev.target.value)
      )
        .then(e => e.json())
        // .then(e => console.log(e))
        .then(res =>
          res.data.map(el => ({
            id: el.attributes["product-id"],
            name: el.attributes.name
          }))
        )
        // .then(e => (console.log(e), e))
        .then(e => setSearchedWhiskeys(e));
    }
    setInputState(ev.target.value);
  };

  const handleWhiskeyChoose = id =>
    getRealTerms(id)
      //   .then(res => (console.log("whiskeychooses", res), res))
      .then(
        res =>
          setCorrectWhiskeyTerms(res.split(",").map(word => word.trim())) ||
          setGuessableTermsState(
            shuffle(
              fakeSample
                .concat(res.split(",").map(word => word.trim()))
                .filter(uniqueShallow)
            ).sort()
          ) ||
          setGameState(GAMESTATES.GUESSING)
      );

  const handleGuessingWhiskey = term => {
    if (!guessesList.includes(term)) setGuessesList(guessesList.concat(term));
    else setGuessesList(guessesList.filter(guess => guess !== term));
  };

  const getCorrectGuesses = _ =>
    guessesList.filter(guess => correctWhiskeyTerms.includes(guess));

  return (
    <div>
      <h1>
        Viskipeli{" "}
        <span role="img" aria-label="whiskey glass">
          🥃
        </span>
        <span
          class="right seedcode"
          title="share this number if playing with friends"
        >
          {" "}
          {seed}
        </span>
      </h1>
      {gameState === GAMESTATES.PRESTART ? (
        <div class="wrapper">
          <div class="text info">
            Jos haluat pelata muiden kanssa, anna heille siemenluku:{" "}
            <span class="seedcode">{seed}</span>
          </div>

          <div>
            Tai syötä tähän heidän siemenlukunsa:
            <input
              class="seedInput"
              oninput={evt => setSeed(evt.target.value)}
              value={seed}
            />
          </div>
          <button onClick={setGameState.bind(null, GAMESTATES.GETWHISKEY)}>
            Aloita!
          </button>
        </div>
      ) : gameState === GAMESTATES.GETWHISKEY ? (
        <div class="wrapper">
          <div class="text info">Haetaan ensin viini hakusanalla:</div>
          <input
            class=""
            placeholder="Laphroaig..."
            oninput={handleInputChange}
            value={inputState}
          />
          <SearchedList
            items={searchedWhiskeys}
            onClick={handleWhiskeyChoose}
          />
        </div>
      ) : gameState === GAMESTATES.GUESSING ? (
        <div class="wrapper">
          <div class="text info">Valitse mitkä termit koskevat tätä viiniä</div>
          <div class="list">
            {console.log(guessableTermsState)}
            {guessableTermsState.map(term => (
              <Term
                term={term}
                onClick={handleGuessingWhiskey}
                isSelected={guessesList.includes(term)}
              />
            ))}
          </div>
          <button
            class="guessingDoneButton green"
            onClick={setGameState.bind(null, GAMESTATES.SHOWINGRESULTS)}
          >
            Lukitsen vastaukset
          </button>
        </div>
      ) : gameState === GAMESTATES.SHOWINGRESULTS ? (
        <div class="wrapper">
          <div class="text info">
            Sait oikein {getCorrectGuesses().length}/
            {correctWhiskeyTerms.length + " "}
            vaihtoehdosta
            {/* {getCorrectGuesses().length
              ? "; " + getCorrectGuesses().join(", ")
              : ""} */}
          </div>
          <div class="text info">
            Vääriä vastauksia oli{" "}
            {guessesList.length - getCorrectGuesses().length + " "} kpl
          </div>
          <div class="text info points">
            Pisteesi ovat{" "}
            {getCorrectGuesses().length -
              (guessesList.length - getCorrectGuesses().length)}
          </div>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

if (typeof window !== "undefined") {
  render(<App />, document.getElementById("root"));
}
