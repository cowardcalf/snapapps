modules.cellularObjects = '2013-August-23';

/*********************************************************************/
/******************************* HOOKS *******************************/
/*********because sometimes you HAVE to mod the original file*********/
/*********************************************************************/

/*
 * Hooks into SpriteMorph.blockTemplates
 * 
 * Adds the blocks to the UI
 */
 
SpriteMorph.prototype.scribbleHookBlockTemplates = SpriteMorph.prototype.snapappsHookBlockTemplates;
SpriteMorph.prototype.snapappsHookBlockTemplates = function(blocks, block, cat, helpMenu)
{
	var myself = this;
	if (cat == "cells")
	{
		button = new PushButtonMorph(
			null,
			function () {
				new CellAttributeDialogMorph(
					null,
					function (pair) {
						if (pair) {
							if (!Cell.addAttribute(pair[0]))
								return;
							//Reset the cells pallette so it makes the new attribute appear
							myself.blocksCache[cat] = null;
							myself.paletteCache[cat] = null;
							var ide = myself.parentThatIsA(IDE_Morph);
							ide.stage.setCellAttributeVisibility(pair[0], true);
							ide.refreshPalette();
							ide.refreshCellAttributes();
							ide.attributeSelector.setChoice(pair[0]);
						}
					},
					myself
				).prompt(
					'Cell attribute name',
					null,
					myself.world()
				);
			},
			'Make a cell attribute'
		);
		button.userMenu = helpMenu;
		button.selector = 'addCellAttribute';
		button.showHelp = BlockMorph.prototype.showHelp;
		blocks.push(button);

		if (Cell.attributes.length > 0) {
			button = new PushButtonMorph(
				null,
				function () {
					var menu = new MenuMorph(
						myself.deleteCellAttribute, /*Callback: SpriteMorph.prototype.deleteCellAttribute*/
						null,
						myself
					);
					for (var i=0; i<Cell.attributes.length; i++)
					{
						var name = Cell.attributes[i];
						menu.addItem(name, name);
					};
					menu.popUpAtHand(myself.world());
				},
				'Delete a cell attribute'
			);
			button.userMenu = helpMenu;
			button.selector = 'deleteCellAttribute';
			button.showHelp = BlockMorph.prototype.showHelp;
			blocks.push(button);
		}

		blocks.push('-');

		if (Cell.attributes.length > 0) {
			for (var i=0; i<Cell.attributes.length; i++)
			{
				var toggle = new ToggleMorph(
					'checkbox',
					{cellAttribute: Cell.attributes[i]},
					function () {
						myself.parentThatIsA(IDE_Morph).stage.toggleCellAttributeVisibility(this.cellAttribute);
					},
					null,
					function () {
						return myself.parentThatIsA(IDE_Morph).stage.getCellAttributeVisibility(this.cellAttribute);
					},
					null
				);
				toggle.nextIsRight = true;
				blocks.push(toggle);
				
				var colour = new ColorSlotMorph();
				colour.isStatic = true;
				colour.setColor(new Color(100,100,100));
				colour.cellAttribute = Cell.attributes[i];
				colour.oldSetColour = colour.setColor;
				colour.setColor = function(col)
				{
					Cell.attributeColours[this.cellAttribute] = col;
					myself.parentThatIsA(IDE_Morph).stage.dirtyEntireStage();
					return this.oldSetColour(col);
				}
				colour.oldSetColour(Cell.attributeColours[Cell.attributes[i]]);
				colour.nextIsRight = true;
				blocks.push(colour);
				
				var fromField;
				fromField = new InputFieldMorph(Cell.attributeDrawRange[Cell.attributes[i]][0].toString());
				fromField.corner = 12;
				fromField.padding = 0;
				fromField.contrast = this.buttonContrast;
				fromField.hint = "from value";
				fromField.contents().minWidth = 0;
				fromField.setWidth(32); // fixed dimensions
				fromField.drawNew();
				fromField.cellAttribute = Cell.attributes[i];
				fromField.accept = function () {
					var value = Number(fromField.getValue());
					if (isNaN(value))
					{
						fromField.setContents(0);
						return;
					}
					Cell.attributeDrawRange[this.cellAttribute][0] = value;
					myself.parentThatIsA(IDE_Morph).stage.dirtyEntireStage();
				};
				fromField.nextIsRight = true;
				blocks.push(fromField);
				
				var toField;
				toField = new InputFieldMorph(Cell.attributeDrawRange[Cell.attributes[i]][1].toString());
				toField.corner = 12;
				toField.padding = 0;
				toField.contrast = this.buttonContrast;
				toField.hint = "from value";
				toField.contents().minWidth = 0;
				toField.setWidth(32); // fixed dimensions
				toField.drawNew();
				toField.cellAttribute = Cell.attributes[i];
				toField.accept = function () {
					var value = Number(toField.getValue());
					if (isNaN(value))
					{
						toField.setContents(0);
						return;
					}
					Cell.attributeDrawRange[this.cellAttribute][1] = value;
					myself.parentThatIsA(IDE_Morph).stage.dirtyEntireStage();
				};
				blocks.push(toField);
				
				var txt = new TextMorph(toggle.target.cellAttribute);
				txt.fontSize = 12;
				txt.setLeft(toField.right());
				txt.setColor(this.paletteTextColor);
				blocks.push(txt);
			}
			blocks.push('-');
		}
		
		blocks.push(block('testCell'));
	}
    return this.scribbleHookBlockTemplates(blocks, block, cat);
}

SpriteMorph.prototype.deleteCellAttribute = function(name)
{
	for (var i=0; i<Cell.attributes.length; i++)
	{
		if (Cell.attributes[i] == name)
		{
			Cell.attributes.splice(i, 1);
			this.blocksCache["cells"] = null;
			this.paletteCache["cells"] = null;
			var ide = this.parentThatIsA(IDE_Morph);
			ide.refreshPalette();
			ide.refreshCellAttributes();
			ide.stage.setCellAttributeVisibility(name, false);
			ide.stage.dirtyEntireStage();
			return;
		}
	}
}

SpriteMorph.prototype.addCellularBlocks = function () {
	//We add the cells palette
    
    SpriteMorph.prototype.blocks.testCell = {
        type: 'command',
        category: 'cells',
        spec: 'a test cell block',
    };
}

/*********************************************************************/
/***************************** OVERRIDES *****************************/
/*********************************************************************/

SpriteMorph.prototype.blockColor.cells = new Color(100, 180, 180);
SpriteMorph.prototype.categories.push("cells");

/*
** Super simple linear interpol
*/
function valueInterpolate(from, to, mix)
{
	mix = Math.max(0, Math.min(1, mix));
	return from * (1 - mix) + to * mix;
}
/*
** This is used to get the attributes of the cell at (u, v) where u and v are [0,1] and not 
** neccessarily exactly on a cell. The result of the operation puts all the interpolated 
** cellAttributes into the resultCell
*/
function cellInterpolate(resultCell, cellArray, cellArrayWidth, cellArrayHeight, u, v)
{
	// Basically, we get the 4 pixels that surround the u,v position we're given.
	//
	// (floor(u), floor(v))
	// |
	// |       (ceil(u), floor(v))
	// |       |
	// V       V
	// X       X
	// 
	//     . <--(u,v)
	//
    // X       X
	// ^       ^
	// |       |
	// |       (ceil(u), ceil(v))
	// |       
	// (floor(u), ceil(v))
	//
	// Then we get the interpolated (over x axis) cell attribute of the bottom 2 and the top 2 at that u position
	// From there, we interpolate again over y axis between those two values.
	
	// Get position of top left point
	var leftXFloat = u * cellArrayWidth - 0.5;
	var topYFloat = v * cellArrayHeight - 0.5;
	
	var leftX = Math.floor(leftXFloat), topY = Math.floor(topYFloat);
	var rightX = leftX+1, bottomY = topY+1;
	
	//Ensure inside boundaries.
	leftX = Math.max(0, Math.min(cellArrayWidth - 1, leftX));
	topY = Math.max(0, Math.min(cellArrayHeight - 1, topY));
	rightX = Math.max(0, Math.min(cellArrayWidth - 1, rightX));
	bottomY = Math.max(0, Math.min(cellArrayHeight - 1, bottomY));
		
	//Get interpolation thingys, we know these are [0,1]
	var uInterpol = leftXFloat - leftX;
	var vInterpol = topYFloat - topY;
	
	//Actually interpolate
	for (var i = 0; i < Cell.attributes.length; i++)
	{
		var attribute = Cell.attributes[i];
		var topLeftValue = cellArray[topY][leftX].getAttribute(attribute);
		var topRightValue = cellArray[topY][rightX].getAttribute(attribute);
		var bottomLeftValue = cellArray[bottomY][leftX].getAttribute(attribute);
		var bottomRightValue = cellArray[bottomY][rightX].getAttribute(attribute);
		
		var topValue = valueInterpolate(topLeftValue, topRightValue, uInterpol);
		var bottomValue = valueInterpolate(bottomLeftValue, bottomRightValue, uInterpol);
		
		var result = valueInterpolate(topValue, bottomValue, vInterpol);
		
		resultCell.setAttribute(attribute, result, false);
	}
}

StageMorph.prototype.updateCells = function ()
{
	var oldCells = null;
	var oldCellsX = 0;
	var oldCellsY = 0;
	if (this.cells != undefined && this.cells != null && this.cells.length > 0)
	{
		oldCells = this.cells;
		oldCellsY = oldCells.length;
		oldCellsX = oldCells[0].length;
	}
	
	var newCellsX = this.cellsX, newCellsY = this.cellsY;
	if (oldCellsY == newCellsY && oldCellsX == newCellsX) {
		return;
	}
	
	var newCells = [];
	for (var y=0; y<newCellsY; y++)
	{
		var newRow = []
		for (var x=0; x<newCellsX; x++)
		{
			newRow.push(new Cell(x,y, this));
		}
		newCells.push(newRow);
	}
	
	if (oldCells != null)
	{
		for (var y=0; y<newCellsY; y++)
		{
			for (var x=0; x<newCellsX; x++)
			{
				cellInterpolate(newCells[y][x], oldCells, oldCellsX, oldCellsY, (x + 0.5) / newCellsX, (y + 0.5) / newCellsY);
			}	
		}
	}
	
	this.cells = newCells;
	this.dirtyEntireStage();
}

StageMorph.prototype.superInit = StageMorph.prototype.init;
StageMorph.prototype.init = function (globals) {
	this.superInit(globals);
	this.cellsX = 40;
	this.cellsY = 30;
	this.drawGrid = true;
	this.cells = [];
	this.strokeSize = 2;
	this.strokeHardness = 0.5;
	this.strokeValue = 10;
	this.updateCells();
}

StageMorph.prototype.changeCellCount = function(newX, newY)
{
	this.cellsX = newX;
	this.cellsY = newY;
	this.updateCells();
}

StageMorph.prototype.dirtyCellAt = function(x, y)
{
	var cellWidth = this.bounds.width() / this.cellsX;
	var cellHeight = this.bounds.height() / this.cellsY;
    this.world().broken.push(
        new Rectangle(
			this.bounds.left() + cellWidth * x,
			this.bounds.top() + cellHeight * y,
			this.bounds.left() + cellWidth * (x+1),
			this.bounds.top() + cellHeight * (y+1)).spread());
}

StageMorph.prototype.dirtyEntireStage = function()
{
	var world = this.world();
	if (world == null)
		return;
	if (world.broken == null)
		return;
    world.broken.push(this.bounds.spread());
}

StageMorph.prototype.visibleAttributes = ['testAttribute'];

StageMorph.prototype.toggleCellAttributeVisibility = function(name)
{
	this.dirtyEntireStage();
	
	for (var i=0; i<this.visibleAttributes.length; i++)
	{
		if (this.visibleAttributes[i] == name)
		{
			this.visibleAttributes.splice(i, 1);
			return;
		}
	}
	this.visibleAttributes.push(name);
}

StageMorph.prototype.setCellAttributeVisibility = function(name, val)
{
	for (var i=0; i<this.visibleAttributes.length; i++)
	{
		if (this.visibleAttributes[i] == name)
		{
			if (!val)
			{
				this.visibleAttributes.splice(i, 1);
			}
			return;
		}
	}
	if (val)
	{
		this.visibleAttributes.push(name);
	}
	return false;
}

StageMorph.prototype.getCellAttributeVisibility = function(name)
{
	for (var i=0; i<this.visibleAttributes.length; i++)
	{
		if (this.visibleAttributes[i] == name)
		{
			return true;
		}
	}
	return false;
}

StageMorph.prototype.getCellPositionAt = function(pointOrX, y)
{
	if (pointOrX instanceof Point)
	{
		return this.getCellPositionAt(pointOrX.x, pointOrX.y);
	}
	else
	{
		var cellX = (pointOrX - this.bounds.left()) / this.bounds.width() * this.cellsX;
		var cellY = (y - this.bounds.top()) / this.bounds.height() * this.cellsY;
		if (cellX < this.cellsX && cellX >= 0 && cellY < this.cellsY && cellY >= 0)
			return new Point(cellX, cellY);
		return null;
	}
}

StageMorph.prototype.getCellAt = function(pointOrX, y)
{
    var point = this.getCellPositionAt(pointOrX, y);
    
	if (point == null)
	{
		return null;
	}
	else
	{
		return this.cells[Math.floor(point.y)][Math.floor(point.x)];
	}
}

StageMorph.prototype.superDrawOn = StageMorph.prototype.drawOn;
StageMorph.prototype.drawOn = function (aCanvas, aRect) {
	var retnVal = this.superDrawOn(aCanvas, aRect);
    if (this.drawGrid)
	{
		var rectangle, area;
		if (!this.isVisible) {
			return null;
		}
		rectangle = aRect || this.bounds;
		area = rectangle.intersect(this.bounds).round();
		if (area.extent().gt(new Point(0, 0))) {
			var ctx = aCanvas.getContext('2d');
			
			ctx.save();
			
			ctx.beginPath();
			ctx.rect(area.left(), area.top(), area.width(), area.height());
			ctx.clip();
			
			var cellWidth = this.bounds.width() / this.cellsX;
			var cellHeight = this.bounds.height() / this.cellsY;
			var startCellX = Math.floor((area.left()-this.bounds.left())/cellWidth);
			var endCellX = Math.ceil((area.right()-this.bounds.left())/cellWidth);
			var startX = startCellX*cellWidth + this.bounds.left();
			var startCellY = Math.floor((area.top()-this.bounds.top())/cellHeight);
			var endCellY = Math.ceil((area.bottom()-this.bounds.top())/cellHeight);
			var startY = startCellY*cellHeight + this.bounds.top();
			
			//Draw cells
			if (this.cells != undefined && this.cells != null)
			{
				for (var y=startCellY; y<endCellY; y++)
				{
					var cellRow = this.cells[y];
					if (cellRow == null || cellRow == undefined)
						break;
					for (var x=startCellX; x<endCellX; x++)
					{
						var cell = cellRow[x];
						if (cell == null || cell == undefined)
							break;
						
						for (var i=0; i<this.visibleAttributes.length; i++)
						{
							var value = cell.getAttribute(this.visibleAttributes[i]);
							if (value > 0)
							{
								ctx.beginPath();
								ctx.rect(x*cellWidth + this.bounds.left() + 1, y*cellHeight + this.bounds.top() + 1, cellWidth - 1, cellHeight - 1);
								var col = Cell.attributeColours[this.visibleAttributes[i]];
								var dr = Cell.attributeDrawRange[this.visibleAttributes[i]];
								var alp = (value - dr[0]) / (dr[1] - dr[0]);
								if (alp > 1) alp = 1;
								if (alp < 0) alp = 0;
								ctx.fillStyle = 'rgba('+Math.round(col.r)+','+Math.round(col.g)+','+Math.round(col.b)+',' + alp.toFixed(4) + ')';
								ctx.fill();
							}
						}
					}
				}
			}
			
			//Draw grid
			ctx.lineWidth = 1;
			ctx.strokeStyle = "rgb(0,0,0)";
			ctx.beginPath();
			for (var x=startX; x<area.right(); x+=cellWidth)
			{
				ctx.moveTo(x+0.5, area.top());
				ctx.lineTo(x+0.5, area.bottom());
			}
			for (var y=startY; y<area.bottom(); y+=cellHeight)
			{
				ctx.moveTo(area.left(), y+0.5);
				ctx.lineTo(area.right(), y+0.5);
			}
			ctx.stroke();
			
			ctx.restore();
		}
	}
	return retnVal;
};

//This is the cell attribute draw tool
StageMorph.prototype.drawTool = false;
StageMorph.prototype.mouseClickLeft = function()
{
}

StageMorph.prototype.mouseDownLeft = function()
{
    if (this.drawTool)
    {
        var worldhand = this.world().hand;
        this.previousPoint = new Point(worldhand.bounds.origin.x, worldhand.bounds.origin.y);
    }
}

/*
** Many thanks to Grumdrig (http://stackoverflow.com/users/167531/grumdrig) from StackOverflow.com for this snippet
** http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
**
** BEGIN SNIPPET
*/
function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  if (t < 0) return dist2(p, v);
  if (t > 1) return dist2(p, w);
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }
/*
** END SNIPPET
*/

/*
 * Override for the default implementation of StageMorph.mouseDownLeft
 * 
 * Called to draw if the pen is in use
 */
StageMorph.prototype.mouseMove = function(point)
{
    if (this.drawTool && this.world().hand.mouseButton === "left")
    {
        var previous = this.getCellPositionAt(this.previousPoint);
        var next = this.getCellPositionAt(point);
        if (previous != null && next != null)
        {
			var strokeDecayWidth = Math.max(0, this.strokeSize);
			var strokeFullWidth = strokeDecayWidth * Math.max(0, Math.min(1, this.strokeHardness));
			var drawAttribute = this.parentThatIsA(IDE_Morph).attributeSelector.getValue();
			
			if (strokeDecayWidth < strokeFullWidth)
				strokeFullWidth = strokeDecayWidth;
			
			var strokeGrad = 1 / (strokeFullWidth - strokeDecayWidth);
			var strokeXIntercept = strokeDecayWidth;
			
			var minX, minY, maxX, maxY;
			
			if (previous.x < next.x) {
				minX = previous.x - strokeDecayWidth;
				maxX = next.x + strokeDecayWidth;
			} else {
				minX = next.x - strokeDecayWidth;
				maxX = previous.x + strokeDecayWidth;
			}
			
			if (previous.y < next.y) {
				minY = previous.y - strokeDecayWidth;
				maxY = next.y + strokeDecayWidth;
			} else {
				minY = next.y - strokeDecayWidth;
				maxY = previous.y + strokeDecayWidth;
			}
			
			minX = Math.floor(minX);
			minY = Math.floor(minY);
			maxX = Math.ceil(maxX);
			maxY = Math.ceil(maxY);
			
			minX  = Math.max(0, Math.min(this.cellsX-1, minX));
			minY = Math.max(0, Math.min(this.cellsY-1, minY));
			maxX = Math.max(0, Math.min(this.cellsX-1, maxX));
			maxY = Math.max(0, Math.min(this.cellsY-1, maxY));
			
            for (var y=minY; y<=maxY; y++)
            {
                for (var x=minX; x<=maxX; x++)
                {
                    var cell = this.cells[y][x];
					var lineWidth = previous.x - next.x;
					var lineHeight = previous.y - next.y;
					var distanceToLine = distToSegment({x: x + 0.5, y: y + 0.5}, previous, next); 
					var alpha;
					if (this.strokeHardness == 1)
					{
						if (distanceToLine < strokeFullWidth)
							alpha = 1;
						else
							alpha = 0;
					}
					else
					{
						alpha = Math.min(1, (distanceToLine - strokeXIntercept) * strokeGrad);
					}
		            if (alpha > 0 && cell != null)
		            {
						var newValue = cell.getAttribute(drawAttribute) * (1 - alpha) + this.strokeValue * alpha;
						cell.setAttribute(drawAttribute, newValue);
		            }
                }
            }
        }
    }
    
    this.previousPoint = new Point(point.x, point.y);
}

SpriteMorph.prototype.createCellularClone = function()
{
	var clone = this.fullCopy();
	clone.parentSprite = this;
	clone.scripts = this.scripts;
	return clone;
}

//By default every sprite is a prototype
//When we make a clone, we set this field 
//to the parent sprite so we can tell who came from where
SpriteMorph.prototype.parentSprite = null;

//We need to override EVERY attempt to start a set of blocks
//running in the process queue so that we can force the use of
//the same blocks on many objects.

//Green flag override:
// Main issues here are 
StageMorph.prototype.fireGreenFlagEvent = function () {
    var procs = [],
        hats = [],
        ide = this.parentThatIsA(IDE_Morph),
        myself = this;

    this.children.concat(this).forEach(function (morph) {
        if (morph instanceof SpriteMorph || morph instanceof StageMorph) {
			var myHats = morph.allHatBlocksFor('__shout__go__');
			for (var i=0; i<myHats.length; i++)
			{
				var hat = {};
				hat.hat = myHats[i];
				hat.object = morph;
				hats = hats.concat(hat);
			}
        }
    });
    hats.forEach(function (hat) {
		//If it is a prototype, dont let it do anything.
		if (hat.object.parentSprite == null)
			return;
		//Create the process as if the hat's receiver is this object so that all the variables for the process are correctly assigned
		//A process never updates its receiver once it is set here, so we can feel free to change it later whenever.
		var preReceiver = hat.hat.receiver;
		hat.hat.receiver = function () { return hat.object };
		var process = myself.threads.startProcess(
            hat.hat,
            myself.isThreadSafe
        );
		process.receiver = hat.object;
		hat.hat.receiver = preReceiver;
        procs.push(process);
    });
    if (ide) {
        ide.controlBar.pauseButton.refresh();
    }
    return procs;
};

/*********************************************************************/
/****************************** STATICS ******************************/
/*********************************************************************/
//Snap calls this after initBlocks is defined. We call addCellularBlocks to add the new blocks.
SpriteMorph.prototype.addCellularBlocks();