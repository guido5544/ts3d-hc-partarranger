# Part Arranger
This class essentially “dissolves” a model (or a subset of a model) into its individual pieces and rearranges those pieces in a stacked grid. It makes for an interesting effect but it also has “real” use cases, mainly in visualizing the content of a model in quantity take-off scenarios, analyzing the content of a model or to temporarily “pull out” relevant parts of an assembly or building model for further inspection.

The current implementation bases the positioning of the grid on the Up-Axis and the bounding box of the loaded model and scales the item-grid relative to the models initial size. The matrices of each arranged element are modified "in place" and the structure of the model is not altered.

This class works great in combination with the [Advanced Model Tree search](https://forum.techsoft3d.com/t/advanced-model-tree-search/480/3) class you can also find in the forum to quickly extract relevant nodes to "pull out" and visualize outside of the model.


## GitHub Project

The public github project can be found here:  
https://github.com/techsoft3d/ts3d-hc-partarranger

If you are planning to fork the project and make changes make sure to run `npm install` in the root folder to install required dependencies.


## Install
Add `dist/hcPartArranger.min.js` to your project.
```
    <script src="./js/smartFilter.min.js"></script>
```

## Demo

Here is how to start the demo with the provided sample model locally when using the Visual Studio Code Live Server plugin:
<http://127.0.0.1:5500/dev/viewer.html?scs=models/microengine.scs>

In addition there is a live demo here:
https://3dsandbox.techsoft3d.com/?snippet=1sFNF2Ojuj0a6VhGhBeMV9



## Usage

`myPartArranger = new PartArranger(hwv);`

Creates a new PartArranger object


`myPartArranger.arrange(items);`

Arranges all elements in the items array which is an array of arrays each containing the id of the node to arrange. The elements will be arranged on a grid in the order of the items array with the elements in the individual arrays stacked on top of each other. See below for example code on creating the items array:


```
let items = [];

let item1= [];                            
item1.push({nodeid: 2});
item1.push({nodeid: 3});

items.push(item1);

let item2= [];
item2.push({nodeid: 4});

items.push(item2);

myPartArranger.arrange(items);
```

`myPartArranger.revert(items);`

Reverts all nodes in the items array back to their original position. If no item array is specified all arranged nodes will be reverted.

`myPartArranger.reset();`

Instantly resets the model back to its original state and reinitializes the class.

`myPartArranger.setScaleFactor(0.1)`

Sets the scale factor that determines the overall size of the arranged items. Default is: 0.04

`myPartArranger.setAnimationDuration(4000)`

Sets the time it takes to arrange the items in milliseconds. Default is 2000

`myPartArranger.setAnimationDelayDuration(1000)`

Sets the total time for the animation delay, which is the delay before each element is arranged. This number is divided by the total number of arranged items. The animation duration + the delay duration will be the total time it takes for all arranged elements to be positioned. Default is 3000.

`myPartArranger.setRelativeScale(true)`

If set to true all arranged elements will be rescaled relative to the largest element in the item array. Otherwise all elements will be scaled to the same size. Default is false.
<br></br>
The following functions are “helper” functions that call into the arrange function above. You can use these functions as examples on how to create your own custom arrange functions.

`myPartArranger.arrangeBodies();`

Arranges all body nodes under the currently selected nodes. All items referring to the same instances will be stacked. The grid is sorted by the number of instances.
If you pass “true” to this function those nodes will be reverted back to their original position.

`myPartArranger.arrangeFromSelection();`

Arranges all currently selected nodes. All items with the same node name will be stacked. The elements are sorted by the number of nodes with the same name.
If you pass “true” to this function those nodes will be reverted back to their original position.

`myPartArranger.arrangeFromSelectionChildren();`

Arranges all child nodes under the currently selected node. All items with the same node name will be stacked. The elements are sorted by the number of nodes with the same name. 
If you pass “true” to this function those nodes will be reverted back to their original position.

## Acknowledgments
### Library:
* [quaternion.js](https://www.npmjs.com/package/quaternion)

### Demo:
* [GoldenLayout](https://golden-layout.com/)

## Disclaimer
**This library is not an officially supported part of HOOPS Communicator and provided as-is.**


