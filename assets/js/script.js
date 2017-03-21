!function() {
	var gobang = document.getElementById("gobang");
	var ctx;
	try {
		ctx = gobang.getContext('2d');
	} catch (e) {
		ctx = null;
	}
	if (ctx == null) return this;

	var canvasW = gobang.clientWidth || gobang.offsetWidth ||  parseInt(gobang.width, 10) || 0,
		canvasH = gobang.clientHeight || gobang.offsetHeight || parseInt(gobang.height, 10) || 0;

	if (!canvasW || !canvasH) return this;

	gobang.width = canvasW;
	gobang.height = canvasH;

	var GridNo = 15;

	if (GridNo < 5) {
		alert("五子棋的棋盘不能小于 5X5 的规格");
		return this;
	}

	var me = true;

	var AI = getAI();

	// draw watermark
	var watermark = new Image();
	watermark.src = "assets/images/logo1.png";
	watermark.onload = function() {
		var img = this,
			imgW = img.width, imgH = img.height,
			imgScale = getImgScale(imgW, imgH),
			posX = 0, posY = 0,
			tarW = imgW, tarH = imgH;
		if (imgW <= canvasW) {
			posX = (canvasW - imgW)/2;
		} else  {
			tarW = canvasW;
		}
		if (imgH <= canvasH) {
			posY = (canvasH - imgH)/2;
		} else {
			tarH = canvasH;
		}
		var tarScale = getImgScale(tarW, tarH);
		if (imgScale < tarScale) {
			tarW = imgScale * tarH;
			posX = (canvasW - tarW)/2;
		} else if (imgScale > tarScale) {
			tarH = tarW / imgScale;
			posY = (canvasH - tarH)/2;
		}
		ctx.drawImage(img, posX, posY, tarW, tarH);
		drawBoardGrid();
	};
	watermark.onerror = function() {
		drawBoardGrid();
	}

	var board = null,
		chessMap = [];

	var Over = false;

	// draw chessboard grid	
	function drawBoardGrid() {
		var pd = 15;

		var boardSize = Math.min(canvasW, canvasH),
			gridSize = boardSize - pd * 2,
			gap = gridSize / (GridNo - 1);

		var startPointX = (canvasW - gridSize)/2,
			startPointY = (canvasH - gridSize)/2, 
			endPointX = canvasW - startPointX,
			endPointY = canvasH - startPointY;

		var toPointX, toPointY;

		ctx.strokeStyle = "#bfbfbf";

		for (var i=0; i<GridNo; i++) {
			toPointX = startPointX + gap * i;
			toPointY = startPointY + gap * i;
			// x
			ctx.moveTo(startPointX, toPointY);
			ctx.lineTo(endPointX, toPointY);
			ctx.stroke();
			// y
			ctx.moveTo(toPointX, startPointY);
			ctx.lineTo(toPointX, endPointY);
			ctx.stroke();
			// init chess map
			chessMap[i] = [];
			for (var j=0; j<GridNo; j++) {
				chessMap[i][j] = -1;
			}
		}

		board = {
			size: boardSize,
			grid: {
				size: gridSize,
				no: GridNo,
				gap: gap,
				pd: pd,
				startPointX: startPointX,
				startPointY: startPointY
			}
		};

		gobang.onclick = function(e) {
			if (!board || Over || !me) return false;
			var x = e.offsetX - board.grid.startPointX,
				y = e.offsetY - board.grid.startPointY;
			(x < 0) && (x = 0);
			(y < 0) && (y = 0);
			var i = x / board.grid.gap,
				j = y / board.grid.gap;
			if (i < 1) {
				i = 0;
			} else {
				i = Math.round(i);
			}
			if (j < 1) {
				j = 0
			} else {
				j = Math.round(j);
			}
			if (!chessMap[i] || chessMap[i][j] != -1) return false;
			chessMap[i][j] = 1;
			drawChesspiece(i, j, me);
			Over = AI.goMyChess(i, j);
			if (Over) {
				setTimeout(function() {
					window.alert("你赢了");
				}, 1000/60);
			} else {
				me = false;
				Over = AI.goComputerChess(chessMap);
				if (Over) {
					setTimeout(function() {
						window.alert("电脑赢了");
					}, 1000/60);
				} else {
					me = true;
				}
			}
		};
	}

	function drawChesspiece(i, j, me) {
		if (!board) return this;
		var centerX = board.grid.startPointX + i * board.grid.gap,
			centerY = board.grid.startPointY + j * board.grid.gap,
			r = board.grid.pd <= 2 ? board.grid.pd : (board.grid.pd - 2);
		ctx.beginPath();
		ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
		ctx.closePath();
		var gradient = ctx.createRadialGradient(centerX+2, centerY-2, r, centerX+2, centerY-2, 0);
		if (me) {
			gradient.addColorStop(0, "#0a0a0a");
			gradient.addColorStop(1, "#636766");
		} else {
			gradient.addColorStop(0, "#d1d1d1");
			gradient.addColorStop(1, "#f9f9f9");
		}
		ctx.fillStyle = gradient;
		ctx.fill();
	}
	
	function getImgScale(w, h) {
		var scale, precision = Math.pow(10, 16);
		try {
			scale = Math.floor(w / h * precision)/precision;
		} catch(e) {
			scale = null;
		}
		return scale || 0;
	}

	// 算法实现
	function getAI() {
		// -- 所有赢法的数组
		var wins = [];
		// -- 赢法统计数组
		var myWins = [];
		var computerWins = [];
		// - 初始化赢法数组
		for (var i=0; i<GridNo; i++) {
			wins[i] = [];
			for (var j=0; j<GridNo; j++) {
				wins[i][j] = [];
			}
		}
		var count = 0;
		// - 所有横排的赢法
		for (var i=0; i<GridNo; i++) {
			// 第 i 行
			for (var j=0; j<GridNo-4; j++) {
				// wins[0][0][0] = true
				// wins[0][1][0] = true
				// wins[0][2][0] = true
				// wins[0][3][0] = true
				// wins[0][4][0] = true
				// ...
				// wins[0][10][10] = true
				// wins[0][11][10] = true
				// wins[0][12][10] = true
				// wins[0][13][10] = true
				// wins[0][14][10] = true
				// ...
				for (var k=0; k<5; k++) {
					wins[i][j+k][count] = true;
				}
				// 初始化赢法统计数组
				myWins[count] = 0;
				computerWins[count] = 0;
				count ++;
			}
		}
		// - 所有竖排的赢法
		for (var j=0; j<GridNo; j++) {
			// 第 j 列
			for (var i=0; i<GridNo-4; i++) {
				// wins[0][0][count] = true
				// wins[1][0][count] = true
				// wins[2][0][count] = true
				// wins[3][0][count] = true
				// wins[4][0][count] = true
				// ...
				// wins[10][0][count+x] = true
				// wins[11][0][count+x] = true
				// wins[12][0][count+x] = true
				// wins[13][0][count+x] = true
				// wins[14][0][count+x] = true
				// ...
				for (var k=0; k<5; k++) {
					wins[i+k][j][count] = true;
				}
				// 初始化赢法统计数组
				myWins[count] = 0;
				computerWins[count] = 0;
				count ++;
			}
		}
		// - 所有正斜排的赢法
		for (var i=0; i<GridNo-4; i++) {
			for (var j=0; j<GridNo-4; j++) {
				// wins[0][0][count] = true
				// wins[1][1][count] = true
				// wins[2][2][count] = true
				// wins[3][3][count] = true
				// wins[4][4][count] = true
				// +
				// wins[0][1][count+1] = true
				// wins[1][2][count+1] = true
				// wins[2][3][count+1] = true
				// wins[3][4][count+1] = true
				// wins[4][5][count+1] = true
				// ...
				for (var k=0; k<5; k++) {
					wins[i+k][j+k][count] = true;
				}
				// 初始化赢法统计数组
				myWins[count] = 0;
				computerWins[count] = 0;
				count ++;
			}
		}
		// - 所有反斜排的赢法
		for (var i=0; i<11; i++) {
			for (var j=GridNo-1; j>3; j--) {
				// ...
				// wins[0][14][count] = true
				// wins[1][13][count] = true
				// wins[2][12][count] = true
				// wins[3][11][count] = true
				// wins[4][10][count] = true
				// +
				// wins[0][13][count+1] = true
				// wins[1][12][count+1] = true
				// wins[2][11][count+1] = true
				// wins[3][10][count+1] = true
				// wins[4][9][count+1] = true
				// ...
				for (var k=0; k<5; k++) {
					wins[i+k][j-k][count] = true;
				}
				// 初始化赢法统计数组
				myWins[count] = 0;
				computerWins[count] = 0;
				count ++;
			}
		}
		return {
			goMyChess: function(i, j) {
				for (var k=0; k<count; k++) {
					if (wins[i][j][k]) {
						myWins[k]++;
						computerWins[k] = -6;
						if (myWins[k] >= 5) {
							return true;
						}
					}
				}
				return false;
			},
			goComputerChess: function(chessMap) {
				// 初始化计分数组
				var myScore = [];
				var computerScore = [];
				for (var i=0; i<GridNo; i++) {
					myScore[i] = [];
					computerScore[i] = [];
					for (var j=0; j<GridNo; j++) {
						myScore[i][j] = 0;
						computerScore[i][j] = 0;
					}
				}
				var maxScore = 0;
				var u = 0; v = 0;
				for (var i=0; i<GridNo; i++) {
					for (var j=0; j<GridNo; j++) {
						if (chessMap[i][j] == -1) {
							for (var k=0; k<count; k++) {
								if (wins[i][j][k]) {
									if (myWins[k] == 1) {
										myScore[i][j] += 200;
									} else if (myWins[k] == 2) {
										myScore[i][j] += 400;
									} else if (myWins[k] == 3) {
										myScore[i][j] += 2000;
									} else if (myWins[k] == 4) {
										myScore[i][j] += 10000;
									}
									if (computerWins[k] == 1) {
										computerScore[i][j] += 220;
									} else if (computerWins[k] == 2) {
										computerScore[i][j] += 420;
									} else if (computerWins[k] == 3) {
										computerScore[i][j] += 2100;
									} else if (computerWins[k] == 4) {
										computerScore[i][j] += 20000;
									}
								}
							}
							if (myScore[i][j] > maxScore) {
								maxScore = myScore[i][j];
								u = i;
								v = j;
							} else if (myScore[i][j] == maxScore) {
								if (computerScore[i][j] > computerScore[u][v]) {
									u = i;
									v = j;
								}
							}
							if (computerScore[i][j] > maxScore) {
								maxScore = computerScore[i][j];
								u = i;
								v = j;
							} else if (computerScore[i][j] == maxScore) {
								if (myScore[i][j] > myScore[u][v]) {
									u = i;
									v = j;
								}
							}
						}
					}
				}
				if (chessMap[u][v] == -1) {
					chessMap[u][v] = 0;
					drawChesspiece(u, v, false);
					for (var k=0; k<count; k++) {
						if (wins[u][v][k]) {
							computerWins[k]++;
							myWins[k] = -6;
							if (computerWins[k] >= 5) {
								return true;
							}
						}
					}
				} else {
					return true;
				}
				return false;
			}
		};
	}
}();