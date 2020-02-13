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
var textRow = document.getElementById("textRow");
var reportString = "";

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
        if (rowData.length <= 14) {
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
                wp: rowData[12],
                timeSpent: rowData[13]
            };
            if(item.wp != undefined && item.wp != null && item.wp != "")
            {
                items.push(item);
            }
        }
    }

    if (items.length > 0)
        generateOutput(items);
}

function generateOutput(items) {

    var totalStoryPoints = 0;
    var assignees = [];
    var projects = [];

    for (i = 0; i < items.length; i++) {
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
    downloadAsPngButton.style = 'align-items: center; justify-content: center; margin-top: 12px';
    downloadAsPngButton.className = "btn btn-success";
    donwloadRow.appendChild(downloadAsPngButton);

    var downloadAsTxtButton = document.createElement('button');
    downloadAsTxtButton.innerText = "Download Text File";
    downloadAsTxtButton.id = "download-button2";
    downloadAsTxtButton.style = 'align-items: center; justify-content: center; margin-top: 12px';
    downloadAsTxtButton.className = "btn btn-info";
    textRow.appendChild(downloadAsTxtButton);

    downloadAsTxtButton.addEventListener("click", download);
    downloadAsPngButton.addEventListener("click", saveDocument);

    var groupProject = items.reduce((r, a) => {
        r[a.projectName] = [...r[a.projectName] || [], a];
        return r;
    }, {});

    // Tasks Per Project

    // Title
    var divTitleProjects = document.createElement('div');
    divTitleProjects.className = 'col-sm-12';
    divTitleProjects.style = 'margin-top:20px';
    dynamic.appendChild(divTitleProjects);

    var titleProjects = document.createElement('h2');
    titleProjects.innerText = 'Time Information / Project';
    titleProjects.className = 'text-center';
    divTitleProjects.appendChild(titleProjects);
    // Title



    // Project section
    for (var key in groupProject) {
        if (groupProject.hasOwnProperty(key)) {
            var totalTimeSpentOnProject = 0;
            for (var i = 0; i < groupProject[key].length; i++)
            {
                if(groupProject[key][i].status === "Done")
                {
                    if(groupProject[key][i].timeSpent != "" && groupProject[key][i].timeSpent != null && groupProject[key][i].timeSpent != undefined)
                        if (groupProject[key][i].timeSpent > 0)    
                            totalTimeSpentOnProject += parseInt(groupProject[key][i].timeSpent);
                }
            }
            totalTimeSpentOnProject = Math.floor(totalTimeSpentOnProject / 3600);
            

            if(totalTimeSpentOnProject > 0)
            {
            reportString = reportString + key + ": " + totalTimeSpentOnProject + " hours\n";
            var divProject = document.createElement('div');
            divProject.className = 'col-sm-12';
            divProject.style = 'border: 1px solid lightblue;margin-top:15px';
            dynamic.appendChild(divProject);

            var divProjectTitle = document.createElement('h3');
            divProjectTitle.innerText = key;
            divProject.appendChild(divProjectTitle);

            var totalPointsForProject = document.createElement('div');
            totalPointsForProject.className = 'alert alert-success text-center';
            totalPointsForProject.innerHTML = 'Total Time Spent For Project ' + key;
            totalPointsForProject.innerHTML = totalPointsForProject.innerHTML + '<br /> <span style="font-size:40px;font-weight: bold;">' + totalTimeSpentOnProject + '</span>h';
            divProject.appendChild(totalPointsForProject);
            }
            var groupOfWorkPackages = groupProject[key].reduce((r,a) => {
                r[a.wp] = [...r[a.wp] || [] , a];
                return r;
            }, {});

            for(var wpkey in groupOfWorkPackages)
            {
                reportString = reportString + "\t" + wpkey + "\n";
                if(groupOfWorkPackages.hasOwnProperty(wpkey))
                {
                    var groupOfWorkPackagesOfAssignee = groupOfWorkPackages[wpkey].reduce((r,a) =>{
                        r[a.assignee] = [...r[a.assignee] || [], a];
                        return r;
                    },{});

                    var temp = groupOfWorkPackages[wpkey].reduce((r,a) =>{
                        r[a.status] = [...r[a.status] || [], a];
                        return r;
                    },{});

                    if(temp["Done"] != undefined && totalTimeSpentOnProject > 0)
                    {
                        var divWorkpackageTitle = document.createElement('h4');
                        divWorkpackageTitle.innerText = "Tasks for workpackage: " + wpkey;
                        divProject.appendChild(divWorkpackageTitle);
                        divWorkpackageTitle.classList.add = wpkey;
                    }

                    for (var assigneeKey in groupOfWorkPackagesOfAssignee)
                    {
                        if(groupOfWorkPackagesOfAssignee.hasOwnProperty(assigneeKey))
                        {
                            var totalTimeSpentOnWP = 0;
                            for (var i = 0; i < groupOfWorkPackagesOfAssignee[assigneeKey].length; i++)
                            {
                                if(groupOfWorkPackagesOfAssignee[assigneeKey][i].status === "Done")
                                {
                                    if(groupOfWorkPackagesOfAssignee[assigneeKey][i].timeSpent != "" && groupOfWorkPackagesOfAssignee[assigneeKey][i].timeSpent != null && groupOfWorkPackagesOfAssignee[assigneeKey][i].timeSpent != undefined)
                                        if (groupOfWorkPackagesOfAssignee[assigneeKey][i].timeSpent > 0)    
                                            totalTimeSpentOnWP += parseInt(groupOfWorkPackagesOfAssignee[assigneeKey][i].timeSpent);
                                }
                            }
                            totalTimeSpentOnWP = Math.floor(totalTimeSpentOnWP / 3600);
                            reportString = reportString + "\t\t" + assigneeKey + ": " + totalTimeSpentOnWP + " hours. \n"
                            console.log("Employee " + assigneeKey + " worked on project " + groupOfWorkPackagesOfAssignee[assigneeKey][0].projectName + " on " + wpkey + " for " + totalTimeSpentOnWP + " hours.")
                            var taskStatusProject = groupOfWorkPackagesOfAssignee[assigneeKey].reduce((r, a) => {
                                r[a.status] = [...r[a.status] || [], a];
                                return r;
                            }, {});


                            for (var taskKey in taskStatusProject) {
                                if (taskKey == "Done"  && totalTimeSpentOnProject > 0) {

                                    var divProjectContent = document.createElement('div');
                                    divProjectContent.className = 'col-sm-12';
                                    divProject.appendChild(divProjectContent);

                                    var totalPointsForAssignee = document.createElement('div');
                                    totalPointsForAssignee.className = 'alert alert-success text-center';
                                    totalPointsForAssignee.innerHTML = 'Total Time Spent For ' + assigneeKey;
                                    totalPointsForAssignee.innerHTML = totalPointsForAssignee.innerHTML + '<br /> <span style="font-size:40px;font-weight: bold;">' + totalTimeSpentOnWP + '</span>h';
                                    divProjectContent.appendChild(totalPointsForAssignee);
                                

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
                                    var remainingTasksTableHeaderAssignee = document.createElement('th');
                                    remainingTasksTableHeaderAssignee.innerText = 'Assignee';

                                    remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderIssueKey);
                                    remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderSummary);
                                    remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderStatus);
                                    remainingTasksTableHeaderRow.appendChild(remainingTasksTableHeaderAssignee);


                                    var remainingTasksTableBody = document.createElement('tbody');
                                    remainingTasksTable.appendChild(remainingTasksTableBody);
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
                
                                        var columnAssignee = document.createElement('td');
                                        columnAssignee.innerText = taskStatusProject[taskKey][k].assignee;
                                        row.appendChild(columnAssignee);

                                        reportString = reportString + "\t\t\t" + taskStatusProject[taskKey][k].issueKey + "\t" + taskStatusProject[taskKey][k].summary + "\n";
                                    }
                                }
                            } 
                        }
                    }
                }       
            }
        }
    }
    if(divProject === undefined)
        alert("There is nothing to show!")
    // Project section
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

var textFile = null, makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };

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

function download() {
    var link = document.createElement('a');
    link.setAttribute('download', 'info.txt');
    link.href = makeTextFile(reportString);
    textRow.appendChild(link);

    // wait for the link to be added to the document
    window.requestAnimationFrame(function () {
      var event = new MouseEvent('click');
      link.dispatchEvent(event);
      textRow.removeChild(link);
    });
}