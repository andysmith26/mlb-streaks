var nameX = 100;
var nameBarGap = 15;
var gapX = 4;
var startY = 30;
var stepY = 20;
var rectSize = 14;
var rectOutlineSize = 1;
var shapeFillDark;
var shapeFillLight;
var shapeStroke;
var labelSize = 12; // should be an even int
var minStreakToDraw = 0;
var teams = [];
var labelColorMain;
var labelColorInverse;
var lastUpdated;
var mouseRow = -1;
var mouseCol = -1;

function setup() {
  createCanvas(400, startY*2 + stepY*(28) + rectSize);
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
  drawData()
  setMouseGridLocation()
}
function loadData(data) {
  lastUpdated = data.file_last_update
  teams = data.teams
  teams.sort(function (a, b) {
    if (a.current_streak != b.current_streak) {
      return parseFloat(b.current_streak) - parseFloat(a.current_streak);
    } else {
      return parseFloat(b.longest_streak) - parseFloat(a.longest_streak);
    }
  });
}

function showTooltip(str, x, y) {
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

      if (mouseRow == i) {
        fill(labelColorDark)
        strokeWeight(1)
        stroke(200, 200, 0)
        showTooltip(teams[i].games.length, 300, getYCoordFromRowNum(i))
      } else {
            fill(labelColorMain);
      noStroke();
          }

        text(abbrev, nameX - textWidth(abbrev), getYCoordFromRowNum(rowsDrawn));
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
      fill(shapeFillLight);
    labelColor = labelColorMain;
  } else {
    fill(shapeFillDark);
    labelColor = labelColorInverse;
  }

  var thisCol = s;
  while (thisCol < n) {
    var xPos = x + ((rectSize + gapX) * thisCol);
    var yPos = getYCoordFromRowNum(thisRow)
    var rectX = xPos - (rectSize / 2);
    var rectY = yPos - ((textAscent(n) - 2) / 2) - (rectSize / 2);
    var rectW = rectSize
    var rectH = rectSize

    // set stroke based on mouse location
    if (mouseRow == thisRow && mouseCol == thisCol) {
      strokeWeight(1)
      stroke(220, 220, 0)
    } else {
      noStroke()
    }
    rect(rectX, rectY, rectH, rectW);
    //    rect(xPos + (textWidth(n) / 2) - (rectSize / 2), yPos - ((textAscent(n) - 2) / 2) - (rectSize / 2), rectSize, rectSize);
    if (thisCol + 1 == n) {
      noStroke();
      fill(labelColor);
      text(n, xPos - (textWidth(n) / 2), yPos);
    }
    thisCol++;
  }
}

function getYCoordFromRowNum(rowNum) {
  yCoord = startY + stepY * rowNum
  return yCoord
}

function setMouseGridLocation() {
  let gridYStart = 17
  let gridYGap = 20
  let row = floor((mouseY - gridYStart) / gridYGap)
  mouseRow = row
  let gridXStart = nameX + nameBarGap
  let gridXGap = 20
  let col = floor((mouseX - gridXStart + gridXGap) / gridXGap)
  mouseCol = col
}
