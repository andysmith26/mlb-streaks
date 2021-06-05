var jsonfile = require('jsonfile');
var Mlbgames = require('mlbgames');
var fs = require('fs');
var MASTER_DATA = "public/season-current.json";
var CLIENT_DATA = "public/client-data.json";
var BACKUP_DATA = "public/season_backup.json";
var teams;

/* sample URL =
https://gd2.mlb.com/components/game/mlb/year_2018/month_03/day_31/gid_2018_03_31_slnmlb_nynmlb_1/linescore.json
OR
https://gd2.mlb.com/components/game/mlb/year_2018/month_03/day_31
NOTE NO TRAILING SLASH
*/

console.log("starting index.js");
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var server_port = process.env.PORT || 8080;
var server_ip_address = process.env.IP || '0.0.0.0';

server.listen(server_port, server_ip_address, function() {
  console.log("Listening on " + server_ip_address + ", port " + server_port);
});

app.use(express.static('public'));
console.log("server is running");

setTimeout(catchUpMaster, 1000); // wait a second before doing initial run
setInterval(catchUpMaster, 10 * 60 * 1000); // then update every ten minutes

function fixNum(n) {
  if (n < 10) {
    n = "0" + n;
  } else {
    n = n.toString();
  }
  return n;
}

function dateToPath(d) {
  return "year_" + fixNum(d.getFullYear()) + "/month_" + fixNum(d.getMonth() + 1) + "/day_" + fixNum(d.getDate()) + "/";
}

function incrementPath(p) {
  var d = new Date(p.slice(5, 9), (p.slice(16, 18)) - 1, p.slice(23, 25));
  d.setDate(d.getDate() + 1);
  return dateToPath(d);
}

function catchUpMaster() {
  var obj = jsonfile.readFileSync(MASTER_DATA);
  let now = new Date();
  let startingDate = new Date();
  startingDate.setDate(now.getDate() - 3);
  updateMasterData(dateToPath(startingDate));
}

// update master data for a certain day
function updateMasterData(path) {
  var obj = jsonfile.readFileSync(MASTER_DATA);
  teams = obj.teams;
  var options = {
    path: path
  };
  var mlbgames = new Mlbgames(options);
  console.log();
  console.log("  ********");
  console.log("  * ");
  console.log("  * retreiving source file from: " + options.path);
  console.log("  * ");
  console.log("  ********");
  console.log();
  var now = new Date();
  var oneWeekInTheFuture = new Date();
  oneWeekInTheFuture.setDate(now.getDate() + 7);
  mlbgames.get((err, games) => {
    if (games) {
      console.log("  games found: " + games.length);
      console.log();
      for (var i = 0; i < games.length; i++) {
        console.log("    " + games[i].status.status + ": " + games[i].id);
        if (games[i].status.status == "Final" || games[i].status.status == "Preview") { //include status = "Game Over" causes W/L to not be reported
          teams = insert_game_data(extract_game_data(games[i]), teams);
        }
        // handle other unfinished statuses (delay, resched. etc)
        // In Progress, Pre-Game, Postponed
      }
      obj.teams = teams;
      obj.file_last_update = now.toJSON();
      obj.last_path_imported = path;
      console.log();
      jsonfile.writeFileSync(MASTER_DATA, obj, { spaces: 2, EOL: '\r\n' });
    } else {
      console.log("  no games found\n");
      console.log("  error: " + err);
    }
    var todaysPath = dateToPath(now);
    var oneWeekInTheFuturePath = dateToPath(oneWeekInTheFuture);
    if (incrementPath(path).localeCompare(oneWeekInTheFuturePath) <= 0) {
      updateMasterData(incrementPath(path));
    } else {
      updateTeamInfoInMasterData();
    }

  }); //mlbgames.get end
}
/**
 * Appends a game to a data structure of games
 * @param {Array} gameTeams //length-2 array of two teams playing in one game
 * @param {Object} teams
 */
function insert_game_data(gameTeams, teams) {
  for (var i = 0; i < gameTeams.length; i++) {
    console.log("*** analyzing game ***");
    console.log(gameTeams[i]);
    var logMessage = "";
    var thisTeam = gameTeams[i].abbrev;
    var thisGame = {
      "id": gameTeams[i].id,
      "runs_for": gameTeams[i].runs_for,
      "runs_against": gameTeams[i].runs_against,
      "result": gameTeams[i].outcome
    };
    var foundTeam = false;
    for (var j = 0; j < teams.length; j++) {
      //console.log(thisTeam + " =? " + teams[j].abbrev)
      if (thisTeam == teams[j].abbrev) {
        foundTeam = true;
        //console.log("*** team info before adding a game ***");
        //console.log(teams[j]);
        var foundGame = false;
        for (var k = 0; k < teams[j].games.length; k++) {
          let checkingGame = teams[j].games[k];
          if (thisGame.id == checkingGame.id) {
            foundGame = true;
            logMessage = "found game. checking for update.";
            if (thisGame.runs_for == checkingGame.runs_for &&
                thisGame.runs_against == checkingGame.runs_against &&
                thisGame.result == checkingGame.result) {
              logMessage += "\n all info matches. no update needed.";
            } else {
              teams[j].games[k].runs_for = thisGame.runs_for;
              teams[j].games[k].runs_against = thisGame.runs_against;
              teams[j].games[k].result = thisGame.result;
              logMessage += "\n new info available. updated.";
            }
            break;
          }
        }
        if (!foundGame) {
          logMessage = "new game. importing.";
          teams[j].games[teams[j].games.length] = thisGame;
        }
        //console.log("*** team info after adding a game ***");
        //console.log(teams[j]);
      }
    }
    if (!foundTeam) {
      logMessage = "can't find team";
    }
    console.log("      " + thisTeam + ": " + logMessage);
  }
  return teams;
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
    "id": game.id
  };
  var away_team = {
    "abbrev": game.away_name_abbrev,
    "id": game.id
  };
  var status = game.status.status;
  if (status == "Final") {
    home_team.runs_for = parseInt(game.linescore.r.home);
    home_team.runs_against = parseInt(game.linescore.r.away);
    away_team.runs_for = parseInt(game.linescore.r.away);
    away_team.runs_against = parseInt(game.linescore.r.home);
    if (home_team.runs_for > away_team.runs_for) {
      home_team.outcome = "W";
      away_team.outcome = "L";
    } else if (away_team.runs_for > home_team.runs_for) {
      home_team.outcome = "L";
      away_team.outcome = "W";
    } else {
      home_team.outcome = "T";
      away_team.outcome = "T";
    }
  } else if (status == "Preview" || status == "Pre-Game") {
    home_team.runs_for = 0;
    home_team.runs_against = 0;
    away_team.runs_for = 0;
    away_team.runs_against = 0;
    home_team.outcome = "N"; // not final
    away_team.outcome = "N"; // not final
  }
  output = [home_team, away_team];
  //console.log(output);
  return output;
}

function getSortedGameList(gameList) {
  var newList = gameList.sort(function(a, b) {
    return (a.id < b.id) ? 1 : ((a.id > b.id) ? -1 : 0);
  });
  return newList;
}

function getCurrentStreak(gameList) {
  var streak = 0;
  for (var i = 0; i < gameList.length; i++) {
    if (gameList[i].result == 'N') {
      continue;
    } else if (gameList[i].result == 'W') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getLongestStreak(gameList) {
  var workingStreak = 0;
  var longestStreak = 0;
  var workingStartGameId;
  for (var i = 0; i < gameList.length; i++) {
    if (gameList[i].result == 'W') {
      workingStreak++;
    } else {
      if (workingStreak > longestStreak) {
        longestStreak = workingStreak;
      }
      workingStreak = 0;
    }
  }
  return longestStreak;
}

function createClientData() {
  var obj = jsonfile.readFileSync(MASTER_DATA);
  console.log();
  console.log("*********");
  console.log(" creating client data");
  var teams = [];
  for (var i = 0; i < obj.teams.length; i++) {
    var gameList = getSortedGameList(obj.teams[i].games);
    var streakInfo = getStreakInfo(gameList);
    var team = {
      "abbrev": obj.teams[i].abbrev,
      "next_game": streakInfo.next_game,
      "streak": streakInfo.streak,
    };
    teams.push(team);
  }
  let data = {
    "file_last_updated": new Date(),
    "teams": teams
  };
  jsonfile.writeFileSync(CLIENT_DATA, data,{ spaces: 2, EOL: '\r\n' });
  console.log(" done\n*********");
  console.log();
}

function getStreakInfo(games) {
  let output = {
    "next_game": null,
    "streak": []
  };
  let i = 0;
  while (i < games.length) {
    if (!output.next_game && games[i].result != "N") {
      output.next_game = games[i-1];
    }
    if (games[i].result == "W") {
      output.streak.push(games[i]);
    } else if (games[i].result == "L") {
      break;
    }
    i++;
  }
  return output;
}

function updateTeamInfoInMasterData() {
  var obj = jsonfile.readFileSync(MASTER_DATA);
  console.log();
  console.log("  updating team info");
  for (var i = 0; i < obj.teams.length; i++) {
    // get game count
    var gameCount = obj.teams[i].games.length;
    var abbrev = obj.teams[i].abbrev;
    obj.teams[i].game_count = gameCount;
    console.log("    " + abbrev + " game count:      " + gameCount);
    // get streak info
    var gameList = getSortedGameList(obj.teams[i].games);
    var currentStreak = getCurrentStreak(gameList);
    var longestStreak = getLongestStreak(gameList);
    obj.teams[i].current_streak = currentStreak;
    obj.teams[i].longest_streak = longestStreak;
    console.log("    " + abbrev + " current streak:  " + currentStreak);
    console.log("    " + abbrev + " longest streak:  " + longestStreak);
    console.log();
  }
  console.log();
  jsonfile.writeFileSync(MASTER_DATA, obj, { spaces: 2, EOL: '\r\n' });
  createClientData();
}
//catchUpMaster();
