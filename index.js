var jsonfile = require('jsonfile');
var Mlbgames = require('mlbgames');
var fs = require('fs');
var MASTER_DATA = "public/season.json";
var BACKUP_DATA = "public/season_backup.json";
var teams;


console.log("starting index.js");
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var server_port = process.env.PORT || 8080;
var server_ip_address = process.env.IP || '0.0.0.0';

server.listen(server_port, server_ip_address, function () {
    console.log( "Listening on " + server_ip_address + ", port " + server_port );
});

app.use(express.static('public'));
console.log("server is running");

setTimeout(catchUpMaster, 60 * 1000);
           
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
  jsonfile.readFile(MASTER_DATA, function (err, obj) {
    updateMasterData(obj.last_path_imported);
  });
}

function saveDataFile(obj) {
  jsonfile.writeFile(MASTER_DATA, obj, {
    spaces: 2
  }, function (err) {
    if (err) {
      console.error("  error saving data file:" + err);
      console.log();
    } else {
      console.log("  saved data file: " + MASTER_DATA);
      console.log();
      fs.createReadStream(MASTER_DATA).pipe(fs.createWriteStream(BACKUP_DATA));
      console.log("  saved backup data file: " + BACKUP_DATA);
      console.log();
    }
  });
}

function updateMasterData(path) {
  jsonfile.readFile(MASTER_DATA, function (err, obj) {
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
    mlbgames.get((err, games) => {
        if (games) {
            console.log("  games found: " + games.length);
            console.log();
            var count_of_final_games = 0;
            for (var i = 0; i < games.length; i++) {
                console.log("    " + games[i].status.status + ": " + games[i].id);
                if (games[i].status.status == "Final") {
                    //console.log(teams.length);
                    teams = insert_game_data(extract_game_data(games[i]), teams);
                    count_of_final_games++;
                }
            }
            obj.teams = teams;
            obj.file_last_update = now.toJSON();
            obj.last_path_imported = path;
            console.log();
            saveDataFile(obj);
        } else {
            console.log("  no games found\n");
            console.log("  error: " + err);
        }
        var todaysPath = dateToPath(now);
            if (incrementPath(path).localeCompare(todaysPath) <= 0) {
                updateMasterData(incrementPath(path));
            } else {
                updateTeamInfoInMasterData();
            }

    }); //mlbgames.get end
  });
}
/**
 * Appends a game to a data structure of games
 * @param {Array} gameTeams //length-2 array of two teams playing in one game
 * @param {Object} teams
 */
function insert_game_data(gameTeams, teams) {
  for (var i = 0; i < gameTeams.length; i++) {
    //console.log("*** analyzing game ***");
    //console.log(gameTeams[i]);
    var logMessage = "";
    var thisTeam = gameTeams[i].abbrev;
    var thisGame = {
      "id": gameTeams[i].id,
      "runs": gameTeams[i].runs,
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
          if (thisGame.id == teams[j].games[k].id) {
            foundGame = true;
            logMessage = "game already imported.";
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
    "id": game.id,
    "runs": parseInt(game.linescore.r.home)
  };
  var away_team = {
    "abbrev": game.away_name_abbrev,
    "id": game.id,
    "runs": parseInt(game.linescore.r.away)
  };
  if (game.status.status == "Final") {
    if (home_team.runs > away_team.runs) {
      home_team.outcome = "W";
      away_team.outcome = "L";
    } else {
      home_team.outcome = "L";
      away_team.outcome = "W";
    }
  }
  output = [home_team, away_team];
  //console.log(output);
  return output;
}

function getSortedGameList(gameList) {
  var newList = gameList.sort(function (a, b) {
    return (a.id < b.id) ? 1 : ((a.id > b.id) ? -1 : 0);
  });
  return newList;
}

function getCurrentStreak(gameList) {
  var streak = 0;
  for (var i = 0; i < gameList.length; i++) {
    if (gameList[i].result == 'W') {
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

function updateTeamInfoInMasterData() {
  jsonfile.readFile(MASTER_DATA, function (err, obj) {
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
    saveDataFile(obj);
  });
}
//catchUpMaster();
