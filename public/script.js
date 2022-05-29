const MIN_STREAK = 2;
// const BASE_URL_GAME_PREVIEW = "https://www.mlb.com/gameday/"
const BASE_URL_GAME = "https://baseballsavant.mlb.com/";
const URL_PREVIEW = "preview?game_pk=";
const URL_FEED = "gamefeed?gamePk=";

document.addEventListener("DOMContentLoaded", () => {
    fetch("client-data.json")
        .then(response => response.json())
        .then(data => {
            lastUpdated = data.file_last_update
            data.teams.sort(function (a, b) {
                return b.streak.length - a.streak.length;
            });
            // console.log(data);
            drawTeams(data);
        });
});

function drawTeams(data) {
    for (var i = 0; i < data.teams.length; i++) {
        const theTeam = data.teams[i];
        var currentStreak = theTeam.streak.length;
        if (currentStreak >= MIN_STREAK) {
            document.querySelector("#data").appendChild(drawTeam(theTeam));
        }
    }
}

//     <div class="card" style="width: 18rem;">
//     <img src="..." class="card-img-top" alt="...">
//     <div class="card-body">
//       <h5 class="card-title">Card title</h5>
//       <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
//       <a href="#" class="btn btn-primary">Go somewhere</a>
//     </div>
//   </div>

function drawTeam(team) {
    // console.log(team.streak);
    team.streak.sort(function (a, b) {
        return a.id.localeCompare(b.id);
    });
    const row = document.createElement("div");
    row.classList.add("d-flex", "justify-content-end");

    // build element for previous games
    for (game of team.streak) {
        const streakGame = document.createElement("a");
        streakGame.classList.add("doneGame", "col-1", "btn");
        streakGame.href = BASE_URL_GAME + URL_FEED + game.pk;
        // console.log(game.pk)
        row.appendChild(streakGame);

        const cardText = document.createElement("div");
        cardText.classList.add("align-middle");
        cardText.innerHTML = getGameShortText(team.abbrev, game);
        // console.log(team);
        streakGame.appendChild(cardText);
    }

        // build element for next game
        const card = document.createElement("a");
        card.classList.add("nextGame", "col-1", "btn", "align-middle");
        if (team.next_game.free) {
            card.classList.add("freeGameOfTheDay");
        }
        card.href = BASE_URL_GAME + URL_PREVIEW + team.next_game.pk
        row.appendChild(card);
        const cardText = document.createElement("div");
        cardText.classList.add("align-middle");
        cardText.innerHTML = getGameShortText(team.abbrev, team.next_game);
        // console.log(team);
        card.appendChild(cardText);

    // build element for team name
    const teamName = document.createElement("div");
    teamName.classList.add("display-6", "col-2");
    teamName.textContent = team.abbrev;
    row.append(teamName);

    return row;

}

function getGameShortText(abbrev, game) {
    var theTeam = abbrev.toUpperCase()
    var score = game.runs_for + "-" + game.runs_against
    var id = game.id
    var homeTeam = id.substring(11,14).toUpperCase()
    var awayTeam = id.substring(18,21).toUpperCase()
    var opponentString;
    if (theTeam === homeTeam) {
      opponentString = "v" + awayTeam
    } else {
      opponentString = "@" + homeTeam
    }
    var mm = id.substring(5, 7)
    var dd = id.substring(8, 10)
    var date = mm + "/" + dd
    return "<div class='row scoreText'>" + score + "</div>" +
    "<div class='row detailText'>" + opponentString + "</div>" +
    "<div class='row detailText'>" + date + "</div>";
}

