var jsonfile = require('jsonfile')
var Mlbgames = require('mlbgames');
var options = {
  path: 'year_2017/month_04/day_05/'
};

var mlbgames = new Mlbgames(options);
var MASTER_DATA = "teams_test.json";
var teams;

jsonfile.readFile(MASTER_DATA, function(err, obj) {
  teams = obj.teams;
  //console.log(teams);
  mlbgames.get((err, games) => {
    console.log(games.length + " games found");
    var count_of_final_games = 0;
    for(var i = 0; i < games.length; i++) {
      if(games[i].status.status == "Final") {
        //console.log(teams.length);
        teams = insert_game_data(extract_game_data(games[i]), teams);
        count_of_final_games++;
      } else {
        console.log("NON-FINAL GAME FOUND: " + games[i].status.status)
      }
    }
    console.log(count_of_final_games + " games final");
    obj.teams = teams;
    jsonfile.writeFile(MASTER_DATA, obj, {spaces: 2}, function(err) {
      if (err) {
        console.error(err)
      } else {
        console.log("new team file saved");
      }
    })
  });
})

/**
* Appends a game to a data structure of games
* @param {Array} gameTeams //length-2 array of two teams playing in one game
* @param {Object} teams
*/
function insert_game_data(gameTeams, teams) {
  for (var i = 0; i < gameTeams.length; i++) {
    //console.log("*** analyzing game ***");
    //console.log(gameTeams[i]);
    var thisTeam = gameTeams[i].abbrev;
    var thisGame = {
      "id" : gameTeams[i].id,
      "runs" : gameTeams[i].runs,
      "result" : gameTeams[i].outcome
    };
    console.log("analyzing " + thisTeam + " in " + thisGame.id);
    var foundTeam = false;
    for (var j = 0; j < teams.length; j++) {
      //console.log(thisTeam + " =? " + teams[j].abbrev)
      if (thisTeam == teams[j].abbrev) {
        foundTeam = true;
        //console.log("*** team info before adding a game ***");
        //console.log(teams[j]);
        var foundGame = false;
        for (var k = 0; k < teams[j].games.length; k++) {
          if (thisGame.id == teams[j].games[k].id) {
            foundGame = true;
            console.log("  game found. not added.");
            break;
          }
        }
        if (!foundGame) {
          console.log("  this is a new game. extending games list for " + thisTeam);
          teams[j].games[teams[j].games.length] = thisGame;
        }
        //console.log("*** team info after adding a game ***");
        //console.log(teams[j]);
      }
    }
    if (!foundTeam) {
      console.log("  can't find team " + thisTeam);
    }
  }
  return teams;
}


function get_team_by_abbrev(abbrev) {


}

/**
* Extracts relevant data from a game
* @param {Object} game
* @returns {Array} // length-two array with home team, away team
*/
function extract_game_data(game) {
  var output;
  var home_team = {
    "abbrev": game.home_name_abbrev,
    "id": game.id,
    "runs": parseInt(game.linescore.r.home)
  }
  var away_team = {
    "abbrev": game.away_name_abbrev,
    "id": game.id,
    "runs": parseInt(game.linescore.r.away)
  }
  if (game.status.status == "Final") {
    if (home_team.runs > away_team.runs) {
      home_team["outcome"] = "W";
      away_team["outcome"] = "L";
    } else {
      home_team["outcome"] = "L";
      away_team["outcome"] = "W";
    }
  }
  output = [home_team, away_team];
  //console.log(output);
  return output;
}

/**
* Determines whether a team won a given game
* @param {String} team_abbrev
* @param {Date} given_date
* @param {Number} game_number
*/
function game_won(team_abbrev, given_date, game_number) {

}
// function getCountryByCode(code) {
//   return data.filter(
//     function(data) {
//       return data.code == code
//     }
//   );
// }
//
// var found = getCountryByCode('DZ');
//
// document.getElementById('output').innerHTML = found[0].name;
