var files = [];
var data = "";
var dropZone = document.getElementById('dropZone');
var dropZoneText = document.getElementById('dropZoneText');
var dropZoneFile = document.getElementById('dropZoneFile');
var fileName = document.getElementById('fileName');
var errorText = document.getElementById('errorText');
var fileInfo = document.getElementById('fileInfo');
var selectFile = document.getElementById('selectFile');
var dynamic = document.getElementById('dynamic');
var donwloadRow = document.getElementById('downloadRow');
var unassigned = document.getElementById('unassigned');
var fileNumber = 0;
items = [];


function handleFileSelect(e) {
    files = e.target.files;
    extratInformationFromFile();
}

document.getElementById('selectFile').addEventListener('change', handleFileSelect, false);

dropZone.addEventListener('dragover', function (e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

dropZone.addEventListener('drop', function (e) {
    e.stopPropagation();
    e.preventDefault();
    errorText.innerText = "";
    files = e.dataTransfer.files;
    extratInformationFromFile();
});

function extratInformationFromFile() {
    if (files.length > 0) {
        for (var i = 0; i < files.length; i++) {
            if (getFileExtension(files[i].name) != "csv") {
                files = [];
                errorText.innerHTML = "You can only upload .csv files";
                return;
            }
        }
    }

    errorText.style.display = "none";
    var output = [];
    var fileData = [];
    dropZoneText.style.display = 'none';
    dropZoneFile.style.display = 'inline-block';

    for (var i = 0, file; file = files[i]; i++) {

        fileName.innerText = file.name;
        output.push('<li><strong>', escape(file.name), '</strong> (', file.type || 'n/a', ') - ',
            file.size, ' bytes, last modified: ',
            file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a',
            '</li>');

        var reader = new FileReader();
        reader.onload = (function (theFile) {
            return function (e) {
                var base64Str = e.target.result.substring(e.target.result.indexOf(",") + 1);
                var resultString = b64DecodeUnicode(base64Str);
                prepareData(resultString, theFile.name);
            };
        })(file);

        reader.readAsDataURL(file);
    }
    fileInfo.innerHTML = '<ul style="background-color:white">' + output.join('') + '</ul>';
}

function prepareData(resultString, fileName) {
    var rows = resultString.split('\n');

    for (i = 1; i < rows.length; i++) {
        var startIndex = rows[i].indexOf(",\"");
        var endIndex = rows[i].indexOf("\",");

        if (startIndex > 0 && endIndex > 0) {
            for (j = startIndex + 1; j < endIndex - 1; j++) {
                if (rows[i].charAt(j) == ",") {
                    rows[i] = rows[i].replaceAt(j, " ");
                }
            }
        }

        var rowData = rows[i].split(',');

        if (rowData.length <= 14 && rowData.length >= 12) {
            item = {
                sprintName: fileName,
                issueKey: rowData[0],
                issueId: rowData[1],
                summary: rowData[2],
                assignee: isEmpty(rowData[3]) ? "Unassigned" : toTitleCase(rowData[3].split('.').join(' ')),
                status: rowData[4],
                projectKey: rowData[5],
                projectName: rowData[6],
                projectType: rowData[7],
                projectLead: rowData[8],
                projectDescription: rowData[9],
                projectUrl: rowData[10],
                storyPoints: rowData[11],
                wp: rowData[12]
            };
            items.push(item);
        }
    }
    fileNumber = fileNumber + 1;
    if (fileNumber == files.length) {
        generateOutput(items);
    }
}

function generateOutput(items) {

    var downloadAsPngButton = document.createElement('button');
    downloadAsPngButton.innerText = "Download Document";
    downloadAsPngButton.id = "download-button";
    downloadAsPngButton.style = 'align-items: center justify-content: center';
    downloadAsPngButton.className = "btn btn-success";
    donwloadRow.appendChild(downloadAsPngButton);

    downloadAsPngButton.addEventListener("click", saveDocument);

    var groupSpringNames = items.reduce((r, a) => {
        r[a.sprintName] = [...r[a.sprintName] || [], a];
        return r;
    }, {});

    var tasksForAssigneeGraphDataCompleted = [];
    var tasksForAssigneeGraphDataAssigned = [];
    for (sprintName in groupSpringNames) {
        var newObj = {
            name: sprintName,
            legendText: sprintName,
            showInLegend: true,
            type: "line",
            dataPoints: [],
            markerSize: 0
        }
        var newObjForAssigned = {
            name: sprintName,
            legendText: sprintName,
            showInLegend: true,
            type: "line",
            dataPoints: [],
            markerSize: 0
        }
        tasksForAssigneeGraphDataCompleted.push(newObj);
        tasksForAssigneeGraphDataAssigned.push(newObjForAssigned);
    }

    var divSprintGraphParent = document.createElement('div');
    divSprintGraphParent.className = 'col-sm-12';
    dynamic.appendChild(divSprintGraphParent);



    //Fill the data points.
    for (var sprintKey in groupSpringNames) {

        var dataPointsForCompleted = [];
        var dataPointsForAssigned = [];

        if (groupSpringNames.hasOwnProperty(sprintKey)) {
            var sprintForAssignee = groupSpringNames[sprintKey].reduce((r, a) => {
                r[a.assignee] = [...r[a.assignee] || [], a];
                return r;
            }, {});

            for (var assigneeKey in sprintForAssignee) {
                if (sprintForAssignee.hasOwnProperty(assigneeKey)) {
                    var done = 0;
                    for (var k = 0; k < sprintForAssignee[assigneeKey].length; k++) {
                        if (sprintForAssignee[assigneeKey][k].status === "Done")
                            done++;
                    }

                    var itemForCompleted = { label: assigneeKey, y: done };
                    var itemForAssigned = { label: assigneeKey, y: sprintForAssignee[assigneeKey].length };

                    for (var i = 0; i < tasksForAssigneeGraphDataCompleted.length; i++) {
                        if (sprintKey === tasksForAssigneeGraphDataCompleted[i].name) {
                            tasksForAssigneeGraphDataCompleted[i].dataPoints.push(itemForCompleted);
                            dataPointsForCompleted.push(itemForCompleted);
                            tasksForAssigneeGraphDataAssigned[i].dataPoints.push(itemForAssigned);
                            dataPointsForAssigned.push(itemForAssigned);
                        }
                    }
                }
            }

            var divSprintStatGraph = document.createElement('div');
            divSprintStatGraph.style = "height: 300px; width: 100%; margin-top: 80px";
            divSprintStatGraph.id = sprintKey;
            divSprintGraphParent.appendChild(divSprintStatGraph);

            var chart = new CanvasJS.Chart(sprintKey, {
                animationEnabled: true,
                title: {
                    text: sprintKey + " {Assigned - Completed} Stacked Bar Graph",
                    fontFamily: "arial black",
                    fontColor: "#695A42"
                },
                toolTip: {
                    shared: true,
                },
                legend: {
                    verticalAlign: "top",
                    horizontalAlign: "right"
                },
                data: [
                    {
                        type: "stackedColumn",
                        showInLegend: true,
                        color: "#696661",
                        name: "Completed",
                        dataPoints: dataPointsForCompleted
                    },
                    {
                        type: "stackedColumn",
                        showInLegend: true,
                        name: "Assigned",
                        color: "#EDCA93",
                        dataPoints: dataPointsForAssigned
                    }
                ]
            });
            chart.render();

        }
    }

    var divSprintLineGraphParent = document.createElement('div');
    divSprintLineGraphParent.className = 'col-sm-12';
    dynamic.appendChild(divSprintLineGraphParent);

    var divLineGraphCompleted = document.createElement('div');
    divLineGraphCompleted.style = "height: 300px; width: 100% ; margin-top: 40px";
    divLineGraphCompleted.id = "LineGraphCompleted";
    divSprintLineGraphParent.appendChild(divLineGraphCompleted);

    var lineChartCompleted = new CanvasJS.Chart("LineGraphCompleted", {
        title: {
            text: "Completed"
        },
        toolTip: {
            shared: true
        },
        animationEnabled: true,
        data: tasksForAssigneeGraphDataCompleted
    });
    lineChartCompleted.render();

    var divLineGraphAssigned = document.createElement('div');
    divLineGraphAssigned.style = "height: 300px; width: 100%";
    divLineGraphAssigned.id = "LineGraphAssigned";
    divSprintLineGraphParent.appendChild(divLineGraphAssigned);

    var lineChartAssigned = new CanvasJS.Chart("LineGraphAssigned", {
        title: {
            text: "Assigned"
        },
        toolTip: {
            shared: true
        },
        animationEnabled: true,
        data: tasksForAssigneeGraphDataAssigned
    });
    lineChartAssigned.render();


    //Fill the data points


    // !!!Basically we need to render two charts. One for assigned. One for completed.
    //Render the chart


    // Render the chart.
}

function clearFile() {
    dropZoneText.style.display = 'inline-block';
    dropZoneFile.style.display = 'none';
    files = [];
    data = "";
    fileName.innerText = "";
    errorText.innerText = "";
    fileInfo.innerHTML = "";
    dynamic.innerHTML = "";
    donwloadRow.innerHTML = "";
    unassigned.innerHTML = "";
}

// helper functions
String.prototype.replaceAt = function (index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

function getFileExtension(fileName) {
    return fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(atob(str).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
function isEmpty(value) {
    var answer = value === undefined || value === null || value === "";
    return answer;
}

function saveDocument() {
    html2canvas(document.querySelector("#printSection")).then(function (canvas) {
        // window.scrollTo(0,0);
        //document.body.appendChild(canvas);
        a = document.createElement('a');
        //document.body.appendChild(a);
        a.download = "SprintReport.png";
        a.href = "data:image/png;base64" + canvas.toDataURL();
        a.click();
    })
}