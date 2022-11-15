var myLayout;

var myPartArranger;


async function msready() {
    myPartArranger  = new hcPartArranger.PartArranger(hwv);
}


function startup()
{
    createUILayout();
} 

function createUILayout() {

    var config = {
        settings: {
            showPopoutIcon: false,
            showMaximiseIcon: true,
            showCloseIcon: false
        },
        content: [
            {
                type: 'row',
                content: [
                    {
                        type: 'column',
                        content: [{
                            type: 'component',
                            componentName: 'Viewer',
                            isClosable: false,
                            width: 80,
                            componentState: { label: 'A' }
                        }],
                    },                 
                ],
            }]
    };



    myLayout = new GoldenLayout(config);
    myLayout.registerComponent('Viewer', function (container, componentState) {
        $(container.getElement()).append($("#content"));
    });

    myLayout.on('stateChanged', function () {
        if (hwv != null) {
            hwv.resizeCanvas();
          
        }
    });
    myLayout.init();

    var viewermenu = [     
        {
            name: 'Display Stats',
            fun: function () {
                hwv.view.setStatisticsDisplayVisibility(true);
            }
        },                                 
        {
            name: 'Arrange',
            subMenu: [
                {
                    name: 'Arrange Bodies',
                    fun: function () {
                        myPartArranger.arrangeBodies();
                    }
                },
                {
                    name: 'Revert Bodies',
                    fun: function () {
                        myPartArranger.arrangeBodies(true);
                    }
                },
                {
                    name: 'Arrange From Selection',
                    fun: function () {
                        myPartArranger.arrangeFromSelection();
                    }
                },
                {
                    name: 'Arrange Selection - Children',
                    fun: function () {
                        myPartArranger.arrangeFromSelectionChildren();
                    }
                },
                {
                    name: 'Revert Selection',
                    fun: function () {
                        myPartArranger.arrangeFromSelection(true);
                    }
                },
                {
                    name: 'Revert All',
                    fun: function () {
                        myPartArranger.revert();
                    }
                },

            ]
        },
        
    ];

    $('#viewermenu1button').contextMenu(viewermenu, undefined, {
        'displayAround': 'trigger',
        'containment': '#viewerContainer'
    });

}
