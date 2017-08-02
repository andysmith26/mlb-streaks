var jsonfile = require('jsonfile')
var Mlbgames = require('mlbgames');
var options = {
  path: 'year_2017/month_04/day_03/'
};

var mlbgames = new Mlbgames(options);
var MASTER_DATA = "teams_test.json";
var existing_data;
jsonfile.readFile(MASTER_DATA, function(err, obj) {
  existing_data = obj;
})

mlbgames.get((err, games) => {
  console.log(games.length + " games found");
  for(var i = 0; i < games.length; i++) {
    if(games[i].status.status == "Final") {
      insert_game_data(extract_game_data(games[i]));
    }
  }
});

/**
 * Appends a game to a data structure of games
 * @param {Array} game
 * @param {Object} teams
 */
 function insert_game_data(game, teams) {
   for(var i = 0; i < game.length; i++) {
     function replaceByValue( field, oldvalue, newvalue ) {
         for( var k = 0; k < json.length; ++k ) {
             if( oldvalue == json[k][field] ) {
                 json[k][field] = newvalue ;
             }
         }
         return json;
     }
     console.log(game[i].abbrev);
   }
 }


function get_team_by_abbrev(abbrev) {


}

 /**
  * Extracts relevant data from a game
  * @param {Object} game
  * @returns {Array}
  */
  function extract_game_data(game) {
    var home_team = {
      "abbrev": game.home_name_abbrev,
      "runs": parseInt(game.linescore.r.home)
    }
    var away_team = {
      "abbrev": game.away_name_abbrev,
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
    return [home_team, away_team];
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
