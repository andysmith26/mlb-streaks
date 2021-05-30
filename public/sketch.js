var nameX = 50;
var nameBarGap = 30;
var gapX = 4;
var startY = 30;
var rectSize = 50;
var gapY = 4
var stepY = rectSize + gapY;
var rectOutlineSize = 1;
var shapeFillDark;
var shapeFillLight;
var shapeStroke;
var labelSize = 12; // should be an even int
var minStreakToDraw = 2;
var teams = [];
var labelColorMain;
var labelColorInverse;
var lastUpdated;
var mouseRow = -1;
var mouseCol = -1;
var the_cursor;
var mouseOverGame = -1;

function setup() {
  createCanvas(600, startY*2 + stepY*(10) + rectSize);
  background(220);
  loadJSON("season-current.json", loadData);
    shapeFillDark = color(0, 75, 150);
    shapeFillLight = color(200, 200, 200);
  shapeStroke = color(100, 100, 100);
  labelColorMain = color(70, 70, 70);
  labelColorDark = color(20, 20, 20)
    labelColorInverse = color(200, 200, 200);
    console.log("starting from heroku v2");
}

function draw() {
  background(220)
  the_cursor = "default"
  drawData()
  setMouseGridLocation()
  cursor(the_cursor)
}
function loadData(data) {
  lastUpdated = data.file_last_update
  teams = data.teams
  console.log(teams[0])
  teams.sort(function (a, b) {
    if (a.current_streak != b.current_streak) {
      return parseFloat(b.current_streak) - parseFloat(a.current_streak);
    } else {
      return parseFloat(b.longest_streak) - parseFloat(a.longest_streak);
    }
  });
}

function showTooltip(str, x, y) {
  textAlign(LEFT)
  fill(0)
  noStroke()
  text(str, x, y)
}

function drawData() {
  textAlign(LEFT)
  var rowsDrawn = 0;
  var teamsUnderMin = 0;
  for (var i = 0; i < teams.length; i++) {
    var abbrev = teams[i].abbrev;
    var currentStreak = teams[i].current_streak;
    var longestStreak = teams[i].longest_streak;
    if (currentStreak >= minStreakToDraw) {
      textSize(labelSize);

      // // change team name based on mouse location
      // if (mouseRow == i) {
      //   fill(labelColorDark)
      //   strokeWeight(1)
      //   stroke(200, 200, 0)
      // } else {
      //   fill(labelColorMain);
      //   noStroke();
      // }
      // keep team name constant
      fill(labelColorMain);
      noStroke();

        textAlign(RIGHT)
        text(abbrev, nameX, getYCoordFromRowNum(rowsDrawn) + rectSize/2);
        if (currentStreak === longestStreak) {
            drawStreak("currentAndLongest", 0, currentStreak, nameX + nameBarGap, rowsDrawn);
        }
        else {
            drawStreak("current", 0, currentStreak, nameX + nameBarGap, rowsDrawn);
            drawStreak("longest", currentStreak, longestStreak, nameX + nameBarGap, rowsDrawn);
        }
      rowsDrawn++;
    } else {
      teamsUnderMin++;
    }
  }
  //fill(labelColorMain);
  //var minLabel = teamsUnderMin + " teams";
  //text(minLabel, nameX - textWidth(minLabel), currentY);
  //stroke(shapeStroke);
  //strokeWeight(rectOutlineSize);
  //rect(nameX + (nameBarGap / 2) + 1, currentY - 16, 1, rectSize); // FIXME: this is a hack!!
  //textStyle(ITALIC);
  //noStroke();
  //text("no current streak", nameX + nameBarGap, currentY);
    fill(labelColorMain);
    textSize(labelSize - 3);
    textAlign(RIGHT);
    text("last updated " + lastUpdated, width-10, height-10);
}

function drawStreak(type, s, n, x, thisRow) {
  var labelColor;

  // set fill based on streak type
  if (type == "longest") {

    var extension = 3;
    var rectY = getYCoordFromRowNum(thisRow) - ((textAscent(n) - 2) / 2) - (rectSize / 2) - extension;
    var rectH = rectSize + extension * 2
    var rectX = x + ((rectSize + gapX) * n) - (rectSize / 2);
    var rectW = 3
    // fill(255, 0, 0)
    // rect(rectX, rectY, rectW, rectH)

  } else {


    var thisCol = s;
    while (thisCol < n) {
      var xPos = x + ((rectSize + gapX) * thisCol);
      var yPos = getYCoordFromRowNum(thisRow)
      var rectX = xPos - (rectSize / 2);
      var rectY = yPos
      var rectW = rectSize
      var rectH = rectSize

      // set stroke based on mouse location
      if (mouseRow == thisRow && mouseCol == thisCol) {
        if (type != "longest") {
          strokeWeight(1)
          stroke(220, 220, 0)
          showTooltip(getGameShortText(thisRow, n - 1 - thisCol), 30, 10)//getYCoordFromRowNum(thisRow))
          the_cursor = "pointer"
        }
      } else {
        noStroke()
      }
      fill(shapeFillDark);
      labelColor = labelColorInverse;
      rect(rectX, rectY, rectH, rectW);
      //    rect(xPos + (textWidth(n) / 2) - (rectSize / 2), yPos - ((textAscent(n) - 2) / 2) - (rectSize / 2), rectSize, rectSize);

      // // write length of streak inside the box
      // if (thisCol + 1 == n) {
      //   noStroke();
      //   fill(labelColor);
      //   text(n, xPos - (textWidth(n) / 2), yPos);
      // }

      // write game info inside the box
      noStroke()
      fill(labelColor)
      var txt = getGameShortText(thisRow, n - 1 - thisCol)
      textAlign(CENTER, CENTER)
      var textY = yPos + rectSize/2 // + ((textAscent(n) - 2) / 2) - (rectSize / 2);
      text(txt, xPos, textY)

      thisCol++;
    }
    //draw next game
    var xPos = x + ((rectSize + gapX) * thisCol);
    var rectX = xPos - (rectSize / 2);
    push()
    stroke(255, 0, 0)
    fill(255, 220, 200)
    rect(rectX, rectY, rectW, rectH)
    noStroke()
    fill(100, 0, 0)
    text(getNextGame(thisRow), xPos, yPos + rectSize/2)
    pop()
  }
}

function getGameShortText(team, gamesBeforeLastGame) {
  var theTeam = teams[team].abbrev.toUpperCase()
  var game = teams[team].games[gamesBeforeLastGame]
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
  return score + "\n" + opponentString + "\n" + date
}

function getYCoordFromRowNum(rowNum) {
  yCoord = startY + stepY * rowNum
  return yCoord
}

function getStreak(team) {
  let output = []
  let games = teams[team].games;
  let i = 0;
  while (i < games.length) {
    if (games[i].result == "W") {
      output.push(games[i]);
    }
    if (games[i].result == "L") {
      break;
    }
    i++;
  }
  return output;
}

function getNextGame(team) {
  let output = "";
  let games = teams[team].games;
  let i = 0;
  while (i < games.length) {
    if (games[i].result != "N") {
      i--;
      break;
    }
    i++;
  }
  output = getGameShortText(team, i);
  return output;
}

function setMouseGridLocation() {
  // let gridYStart = 17
  // let gridYGap = 20
  let row = floor((mouseY - startY + gapY/2) / (rectSize + gapY))
  mouseRow = row
  let gridXStart = nameX + nameBarGap - rectSize/2
  let col = floor((mouseX - gridXStart + gapX/2) / (rectSize + gapX))
  mouseCol = col
}
