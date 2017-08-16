var nameX = 100;
var nameBarGap = 15;
var gapX = 4;
var startY = 30;
var stepY = 26;
var rectSize = 20;
var rectOutlineSize = 1;
var shapeFill;
var shapeStroke;
var labelSize = 14; // should be an even int
var minStreakToDraw = 1;
var labelColorMain;
var labelColorInverse;

function setup() {
  createCanvas(600, 600);
  background(220);
  loadJSON("season.json", drawData);
  shapeFill = color(0, 75, 150);
  shapeStroke = color(100, 100, 100);
  labelColorMain = color(30, 30, 30);
  labelColorInverse = color(200, 200, 200);
}

function drawData(data) {
  var teams = data.teams;
  teams.sort(function (a, b) {
    if (a.current_streak != b.current_streak) {
      return parseFloat(b.current_streak) - parseFloat(a.current_streak);
    } else {
      return parseFloat(b.longest_streak) - parseFloat(a.longest_streak);
    }
  });
  var rowsDrawn = 0;
  var teamsUnderMin = 0;
  var currentY = 0;
  for (var i = 0; i < teams.length; i++) {
    var abbrev = teams[i].abbrev;
    var currentStreak = teams[i].current_streak;
    var longestStreak = teams[i].longest_streak;
    currentY = startY + stepY * rowsDrawn;
    if (currentStreak >= minStreakToDraw) {
      textSize(labelSize);
      fill(labelColorMain);
      noStroke();
      text(abbrev, nameX - textWidth(abbrev), currentY);
      drawStreak("current", currentStreak, nameX + nameBarGap, currentY);
      drawStreak("longest", longestStreak, nameX + nameBarGap, currentY);
      rowsDrawn++;
    } else {
      teamsUnderMin++;
    }
  }
  var minLabel = teamsUnderMin + " teams";
  text(minLabel, nameX - textWidth(minLabel), currentY);
  stroke(shapeStroke);
  strokeWeight(rectOutlineSize);
  rect(nameX + (nameBarGap / 2) + 1, currentY - 16, 1, rectSize); // FIXME: this is a hack!!
  textStyle(ITALIC);
  noStroke();
  text("no current streak", nameX + nameBarGap, currentY);
}

function drawStreak(type, n, x, y) {
  var labelColor;
  if (type == "longest") {
    stroke(shapeStroke);
    strokeWeight(rectOutlineSize);
    noFill();
    labelColor = labelColorMain;
  } else {
    noStroke();
    fill(shapeFill);
    labelColor = labelColorInverse;
  }
  var i = 0;
  while (i < n) {
    var xPos = x + ((rectSize + gapX) * i);
    var yPos = y;
    rect(xPos + (textWidth(n) / 2) - (rectSize / 2), yPos - ((textAscent(n) - 2) / 2) - (rectSize / 2), rectSize, rectSize);
    if (i + 1 == n) {
      noStroke();
      fill(labelColor);
      text(n, xPos, yPos);
    }
    i++;
  }
}
