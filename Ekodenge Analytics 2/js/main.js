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


function handleFileSelect(e) {

    if (files.length > 0) {
        errorText.innerHTML = "You can upload one file at a time";
        return;
    }

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

    if (files.length > 0) {
        errorText.innerHTML = "You can upload one file at a time";
        return;
    }

    files = e.dataTransfer.files;
    extratInformationFromFile();
});

function extratInformationFromFile() {
    if (files.length > 0) {
        if (getFileExtension(files[0].name) != "csv") {
            files = [];
            errorText.innerHTML = "You can only upload .csv files";
            return;
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
                prepareData(resultString);
            };
        })(file);

        reader.readAsDataURL(file);
    }
    fileInfo.innerHTML = '<ul style="background-color:white">' + output.join('') + '</ul>';
}

function prepareData(resultString) {

    items = [];
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

    if (items.length > 0)
        generateOutput(items);
}

function generateOutput(items) {

    var sprintStatusGraphData = [];
    var projectsGraphData = [];
    var totalTasks = 0;
    var totalStoryPoints = 0;
    var totalAssignee = 0;
    var assignees = [];
    var totalProjects = 0;
    var projects = [];

    for (i = 0; i < items.length; i++) {
        if(!isNaN(items[i].storyPoints))
            totalStoryPoints = totalStoryPoints + Number(items[i].storyPoints);
    }

    assignees = items.map(item => item.assignee).filter((value, index, self) => self.indexOf(value) === index);
    // Name can be changed to totalNumberOfAssignees
    totalAssignee = assignees.length;

    projects = items.map(item => item.projectName).filter((value, index, self) => self.indexOf(value) === index);
    // Name can be changed to totalNumberOfProjects
    totalProjects = projects.length;

    //Name can be changed to totalNumberOfTasks
    totalTasks = items.length;

    var downloadAsPngButton = document.createElement('button');
    downloadAsPngButton.innerText = "Download Document";
    downloadAsPngButton.id = "download-button";
    downloadAsPngButton.style = 'align-items: center justify-content: center';
    downloadAsPngButton.className = "btn btn-success";
    donwloadRow.appendChild(downloadAsPngButton);

    downloadAsPngButton.addEventListener("click", saveDocument);


    // Title
    var divTitle = document.createElement('div');
    divTitle.className = 'col-sm-12';
    dynamic.appendChild(divTitle);

    var title = document.createElement('h2');
    title.innerText = 'General Sprint Information';
    title.className = 'text-center';
    divTitle.appendChild(title);
    // Title




    // General Information
    var divGeneralInfo = document.createElement('div');
    divGeneralInfo.className = 'col-sm-12';
    divGeneralInfo.style = 'margin-top:40px';
    dynamic.appendChild(divGeneralInfo);

    var totalTasksParentDiv = document.createElement('div');
    totalTasksParentDiv.className = 'col-sm-3';
    divGeneralInfo.appendChild(totalTasksParentDiv);

    var tasksWidget = document.createElement('div');
    tasksWidget.className = 'alert alert-danger text-center';
    tasksWidget.innerHTML = 'Total Tasks';
    tasksWidget.innerHTML = tasksWidget.innerHTML + '<br /> <span style="font-size:40px;font-weight: bold;">' + totalTasks + '</span>';
    totalTasksParentDiv.appendChild(tasksWidget);

    var storyPointsParentDiv = document.createElement('div');
    storyPointsParentDiv.className = 'col-sm-3';
    divGeneralInfo.appendChild(storyPointsParentDiv);

    var storyPointWidget = document.createElement('div');
    storyPointWidget.className = 'alert alert-success text-center';
    storyPointWidget.innerHTML = 'Total Story Points';
    storyPointWidget.innerHTML = storyPointWidget.innerHTML + '<br /> <span style="font-size:40px;font-weight: bold;">' + totalStoryPoints + '</span>';
    storyPointsParentDiv.appendChild(storyPointWidget);

    var totalAssigneeParentDiv = document.createElement('div');
    totalAssigneeParentDiv.className = 'col-sm-3';
    divGeneralInfo.appendChild(totalAssigneeParentDiv);

    var assigneeWidget = document.createElement('div');
    assigneeWidget.className = 'alert alert-info text-center';
    assigneeWidget.innerHTML = 'Total Participants';
    assigneeWidget.innerHTML = assigneeWidget.innerHTML + '<br /> <span style="font-size:40px;font-weight: bold;">' + totalAssignee + '</span>';
    totalAssigneeParentDiv.appendChild(assigneeWidget);

    var totalProjectsParentDiv = document.createElement('div');
    totalProjectsParentDiv.className = 'col-sm-3';
    divGeneralInfo.appendChild(totalProjectsParentDiv);

    var projectsWidget = document.createElement('div');
    projectsWidget.className = 'alert alert-warning text-center';
    projectsWidget.innerHTML = 'Total Projects';
    projectsWidget.innerHTML = projectsWidget.innerHTML + '<br /> <span style="font-size:40px;font-weight: bold;">' + totalProjects + '</span>';
    totalProjectsParentDiv.appendChild(projectsWidget);



    // Task status
    var divSprintTaskStatus = document.createElement('div');
    divSprintTaskStatus.className = 'col-sm-6';
    divSprintTaskStatus.style = 'margin-top:30px'
    dynamic.appendChild(divSprintTaskStatus);

    var title = document.createElement('h3');
    title.innerText = 'Task Status';
    title.className = 'text-center';
    divSprintTaskStatus.appendChild(title);

    var graphDiv = document.createElement('div');
    graphDiv.style = "height: 400px; width: 100%;"
    graphDiv.id = "prop";
    divSprintTaskStatus.appendChild(graphDiv);

    var groupTaskStatus = items.reduce((r, a) => {
        r[a.status] = [...r[a.status] || [], a];
        return r;
    }, {});

    for (var key in groupTaskStatus) {
        if (groupTaskStatus.hasOwnProperty(key)) {
            var item = { label: key, y: groupTaskStatus[key].length };
            sprintStatusGraphData.push(item);
        }
    }

    var chart = new CanvasJS.Chart("prop", {
        theme: "light2",
        animationEnabled: true,
        data: [
            {
                type: "pie",
                dataPoints: sprintStatusGraphData
            }
        ]
    });
    chart.render();

    for (var key in groupTaskStatus) {
        var div = document.createElement('p');
        div.innerText = key + ": " + groupTaskStatus[key].length + " (" + Math.round(Number((groupTaskStatus[key].length / totalTasks) * 100)) + "%)";
        divSprintTaskStatus.appendChild(div);
    }
    // Task status

    // Tasks Per Project
    var divSprintTaskPerProject = document.createElement('div');
    divSprintTaskPerProject.className = 'col-sm-6';
    divSprintTaskPerProject.style = 'margin-top:30px'
    dynamic.appendChild(divSprintTaskPerProject);

    var title = document.createElement('h3');
    title.innerText = 'Tasks / Project';
    title.className = 'text-center';
    divSprintTaskPerProject.appendChild(title);

    var graphTaskProjectDiv = document.createElement('div');
    graphTaskProjectDiv.style = "height: 400px; width: 100%;"
    graphTaskProjectDiv.id = "prop-task-project";
    divSprintTaskPerProject.appendChild(graphTaskProjectDiv);

    var groupProject = items.reduce((r, a) => {
        r[a.projectName] = [...r[a.projectName] || [], a];
        return r;
    }, {});
    
    for (var key in groupProject) {
        if (groupProject.hasOwnProperty(key)) {
            var item = { label: key, y: groupProject[key].length };
            projectsGraphData.push(item);
        }
    }
    //MY CODE
    var groupEmployee = items.reduce((r, a) => {
        r[a.assignee] = [...r[a.assignee] || [], a];
        return r;
    }, {});

    var chartProjectGraph = new CanvasJS.Chart("prop-task-project", {
        theme: "light2",
        animationEnabled: true,
        data: [
            {
                type: "pie",
                dataPoints: projectsGraphData
            }
        ]
    });
    chartProjectGraph.render();

    for (var key in groupProject) {
        var div = document.createElement('p');
        div.innerText = key + ": " + groupProject[key].length + " (" + Math.round(Number((groupProject[key].length / totalTasks) * 100)) + "%)";
        divSprintTaskPerProject.appendChild(div);
    }
    // Tasks Per Project

    // Title
    var divTitleProjects = document.createElement('div');
    divTitleProjects.className = 'col-sm-12';
    divTitleProjects.style = 'margin-top:20px';
    dynamic.appendChild(divTitleProjects);

    var titleProjects = document.createElement('h2');
    titleProjects.innerText = 'Task Information / Project';
    titleProjects.className = 'text-center';
    divTitleProjects.appendChild(titleProjects);
    // Title

    // Project section
    for (var key in groupProject) {
        if (groupProject.hasOwnProperty(key)) {
            var divProject = document.createElement('div');
            divProject.className = 'col-sm-12';
            divProject.style = 'border: 1px solid lightblue;margin-top:15px';
            dynamic.appendChild(divProject);

            var divProjectTitle = document.createElement('h3');
            divProjectTitle.innerText = key;
            divProject.appendChild(divProjectTitle);

            var divProjectGraphParent = document.createElement('div');
            divProjectGraphParent.className = 'col-sm-6';
            divProject.appendChild(divProjectGraphParent);

            var divProjectGraph = document.createElement('div');
            divProjectGraph.style = "height: 350px; width: 100%;"
            divProjectGraph.id = key;
            divProjectGraphParent.appendChild(divProjectGraph);

            var taskStatusProject = groupProject[key].reduce((r, a) => {
                r[a.status] = [...r[a.status] || [], a];
                return r;
            }, {});

            var projectGraphData = [];
            for (var taskKey in taskStatusProject) {
                if (taskStatusProject.hasOwnProperty(taskKey)) {
                    var item = { label: taskKey, y: taskStatusProject[taskKey].length };
                    projectGraphData.push(item);
                }
            }

            var chart = new CanvasJS.Chart(key, {
                theme: "light2",
                animationEnabled: true,
                data: [
                    {
                        type: "pie",
                        dataPoints: projectGraphData
                    }
                ]
            });
            chart.render();

            for (var taskKey in taskStatusProject) {
                var div = document.createElement('p');
                div.innerText = taskKey + ": " + taskStatusProject[taskKey].length + " (" + Math.round(Number((taskStatusProject[taskKey].length / groupProject[key].length) * 100)) + "%)";
                divProjectGraphParent.appendChild(div);
            }

            var divProjectContent = document.createElement('div');
            divProjectContent.className = 'col-sm-6';
            divProject.appendChild(divProjectContent);

            var titleRemainingTasks = document.createElement('h4');
            titleRemainingTasks.innerText = 'Remaining Tasks';
            titleRemainingTasks.className = 'text-center';
            divProjectContent.appendChild(titleRemainingTasks);

            var remainingTasksTable = document.createElement('table');
            remainingTasksTable.className = 'table';
            divProjectContent.appendChild(remainingTasksTable);

            var remainingTasksTableHeader = document.createElement('thead');
            remainingTasksTable.appendChild(remainingTasksTableHeader);

            var remainingTasksTableHeaderRow = document.createElement('tr');
            remainingTasksTableHeader.appendChild(remainingTasksTableHeaderRow);

            var remainingTasksTableHeaderIssueKey = document.createElement('th');
            remainingTasksTableHeaderIssueKey.innerText = 'Issue Key';
            var remainingTasksTableHeaderSummary = document.createElement('th');
            remainingTasksTableHeaderSummary.innerText = 'Summary';
            var remainingTasksTableHeaderStatus = document.createElement('th');
            remainingTasksTableHeaderStatus.innerText = 'Status';

            remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderIssueKey);
            remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderSummary);
            remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderStatus);

            var remainingTasksTableBody = document.createElement('tbody');
            remainingTasksTable.appendChild(remainingTasksTableBody);

            for (var taskKey in taskStatusProject) {
                if (taskKey != 'Done') {
                    for (k = 0; k < taskStatusProject[taskKey].length; k++) {
                        var row = document.createElement('tr');
                        remainingTasksTableBody.appendChild(row);

                        var columnIssue = document.createElement('td');
                        columnIssue.innerText = taskStatusProject[taskKey][k].issueKey;
                        row.appendChild(columnIssue);

                        var columnSummary = document.createElement('td');
                        columnSummary.innerText = taskStatusProject[taskKey][k].summary;
                        row.appendChild(columnSummary);

                        var columnStatus = document.createElement('td');
                        columnStatus.innerText = taskStatusProject[taskKey][k].status;
                        row.appendChild(columnStatus);
                    }
                }
            }
        }
    }
    // Project section

    //Title for employee section
    var divTitleEmployees = document.createElement('div');
    divTitleEmployees.className = 'col-sm-12';
    divTitleEmployees.style = 'margin-top: 20px';
    dynamic.appendChild(divTitleEmployees);

    var titleEmployees = document.createElement('h2');
    titleEmployees.innerText = 'Task Information / Employee';
    titleEmployees.className = 'text-center';
    divTitleEmployees.appendChild(titleEmployees);
    //Title for employee section

    // Employee Section
    for (var key in groupEmployee) {
        if (groupEmployee.hasOwnProperty(key)) {
            var divAssignee = document.createElement('div');
            divAssignee.className = 'col-sm-12';
            divAssignee.style = 'border: 1px solid lightblue; margin-top: 15px';

            if (key !== "Unassigned")
                dynamic.appendChild(divAssignee);
            else
                unassigned.appendChild(divAssignee);

            var divAssigneeTitle = document.createElement('h3');
            divAssigneeTitle.innerText = key;
            divAssignee.appendChild(divAssigneeTitle);

            var divAssigneeGraphParent = document.createElement('div');
            divAssigneeGraphParent.className = 'col-sm-6';
            divAssignee.appendChild(divAssigneeGraphParent);

            var divAssigneeGraph = document.createElement('div');
            divAssigneeGraph.style = "height: 300px; width: 100%";
            divAssigneeGraph.id = key;
            divAssigneeGraphParent.appendChild(divAssigneeGraph);

            var taskStatusAssignee = groupEmployee[key].reduce((r, a) => {
                r[a.status] = [...r[a.status] || [], a];
                return r;
            }, {});



            var assigneeGeneralGraphData = [];
            for (var taskKey in taskStatusAssignee) {
                if (taskStatusAssignee.hasOwnProperty(taskKey)) {
                    var item = { label: taskKey, y: taskStatusAssignee[taskKey].length };
                    assigneeGeneralGraphData.push(item);
                }
            }
            var chart = new CanvasJS.Chart(key, {
                theme: "light2",
                animationEnabled: true,
                data: [
                    {
                        type: "pie",
                        dataPoints: assigneeGeneralGraphData
                    }
                ]
            });
            chart.render();

            var divAssigneeContent = document.createElement('div');
            divAssigneeContent.className = 'col-sm-6';
            divAssignee.appendChild(divAssigneeContent);

            var titleRemainingTasks = document.createElement('h4');
            titleRemainingTasks.innerText = 'Remaining Tasks';
            titleRemainingTasks.className = 'text-center';
            divAssigneeContent.appendChild(titleRemainingTasks);

            var remainingTasksTable = document.createElement('table');
            remainingTasksTable.className = 'table';
            divAssigneeContent.appendChild(remainingTasksTable);

            var remainingTasksTableHeader = document.createElement('thead');
            remainingTasksTable.appendChild(remainingTasksTableHeader);

            var remainingTasksTableHeaderRow = document.createElement('tr');
            remainingTasksTableHeader.appendChild(remainingTasksTableHeaderRow);

            var remainingTasksTableHeaderIssueKey = document.createElement('th');
            remainingTasksTableHeaderIssueKey.innerText = 'Issue Key';
            var remainingTasksTableHeaderSummary = document.createElement('th');
            remainingTasksTableHeaderSummary.innerText = 'Summary';
            var remainingTasksTableHeaderStatus = document.createElement('th');
            remainingTasksTableHeaderStatus.innerText = 'Status';

            remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderIssueKey);
            remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderSummary);
            remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderStatus);

            var remainingTasksTableBody = document.createElement('tbody');
            remainingTasksTable.appendChild(remainingTasksTableBody);

            for (var taskKey in taskStatusAssignee) {
                if (taskKey != 'Done') {
                    for (k = 0; k < taskStatusAssignee[taskKey].length; k++) {
                        var row = document.createElement('tr');
                        remainingTasksTableBody.appendChild(row);

                        var columnIssue = document.createElement('td');
                        columnIssue.innerText = taskStatusAssignee[taskKey][k].issueKey;
                        row.appendChild(columnIssue);

                        var columnSummary = document.createElement('td');
                        columnSummary.innerText = taskStatusAssignee[taskKey][k].summary;
                        row.appendChild(columnSummary);

                        var columnStatus = document.createElement('td');
                        columnStatus.innerText = taskStatusAssignee[taskKey][k].status;
                        row.appendChild(columnStatus);
                    }
                }
            }

            for (var taskKey in taskStatusAssignee) {
                var div = document.createElement('p');
                div.innerText = taskKey + ": " + taskStatusAssignee[taskKey].length + " (" + Math.round((taskStatusAssignee[taskKey].length / groupEmployee[key].length) * 100) + "%)";
                divAssigneeGraphParent.appendChild(div);
            }
            //retrieve all projects of employee
            var projectsForAssignee = groupEmployee[key].reduce((obj, el) => {
                obj[el.projectName] = [...obj[el.projectName] || [], el];
                return obj;
            }, {});
            var projectForAssigneeGraphData = [];

            for (propertyName in taskStatusAssignee) {
                var newObj = {
                    name: propertyName,
                    legendText: propertyName,
                    showInLegend: true,
                    type: "column",
                    dataPoints: []
                }
                projectForAssigneeGraphData.push(newObj);
            }

            for (var projectKey in projectsForAssignee) {
                if (projectsForAssignee.hasOwnProperty(projectKey)) {
                    var taskStatusAssigneeForProject = projectsForAssignee[projectKey].reduce((r, a) => {
                        r[a.status] = [...r[a.status] || [], a];
                        return r;
                    }, {});
                    //retrieve status of a task of a project
                    for (var taskKey in taskStatusAssigneeForProject) {
                        if (taskStatusAssigneeForProject.hasOwnProperty(taskKey)) {
                            var item = { label: projectKey, y: taskStatusAssigneeForProject[taskKey].length };
                            for (var i = 0; i < projectForAssigneeGraphData.length; i++) {
                                if (taskKey === projectForAssigneeGraphData[i].name) {
                                    projectForAssigneeGraphData[i].dataPoints.push(item);
                                }
                            }
                        }
                    }
                }
            }
            var divAssigneeBarGraphParent = document.createElement('div');
            divAssigneeBarGraphParent.className = 'col-sm-12';
            divAssignee.appendChild(divAssigneeBarGraphParent);


            var divBarGraph = document.createElement('div');
            divBarGraph.style = "height: 300px; width: 100%";
            divBarGraph.id = key + key;
            divAssigneeBarGraphParent.appendChild(divBarGraph);

            var barChart = new CanvasJS.Chart(key + key, {
                title: {
                    text: "Status for each project for " + key
                },
                toolTip: {
                    shared: true
                },
                animationEnabled: true,
                data: projectForAssigneeGraphData
            });
            barChart.render();
        }
    }
    // Employee Section
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